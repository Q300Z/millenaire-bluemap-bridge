package org.millenaire.bridge.bluemap;

import com.flowpowered.math.vector.Vector2i;
import de.bluecolored.bluemap.api.BlueMapAPI;
import de.bluecolored.bluemap.api.BlueMapMap;
import de.bluecolored.bluemap.api.markers.ExtrudeMarker;
import de.bluecolored.bluemap.api.markers.HtmlMarker;
import de.bluecolored.bluemap.api.markers.LineMarker;
import de.bluecolored.bluemap.api.markers.MarkerSet;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.millenaire.bridge.bluemap.markers.DiplomaticLineMarkerBuilder;
import org.millenaire.bridge.bluemap.markers.VillageCenterMarkerBuilder;
import org.millenaire.bridge.bluemap.markers.VillageZoneMarkerBuilder;
import org.millenaire.bridge.dto.BuildingSnapshotDTO;
import org.millenaire.bridge.dto.DiplomaticRelationDTO;
import org.millenaire.bridge.dto.VillageSnapshotDTO;

import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

public class BlueMapIntegrationService {
    private static final Logger LOGGER = LogManager.getLogger();
    public static final String VILLAGE_SET_ID = "millenaire_villages";
    public static final String DIPLOMACY_SET_ID = "millenaire_diplomacy";

    private volatile BlueMapAPI blueMapApi;
    private volatile List<VillageSnapshotDTO> lastSnapshots;
    private volatile List<VillageSnapshotDTO> lastSyncedSnapshots;
    private final Map<UUID, String> structuralSignatures = new ConcurrentHashMap<>();
    private final Set<Vector2i> pendingRegions = ConcurrentHashMap.newKeySet();
    private volatile boolean baselineLoaded = false;
    private volatile Consumer<Path> webRootListener;

    public void setWebRootListener(Consumer<Path> webRootListener) {
        this.webRootListener = webRootListener;
    }

    public synchronized void resetState() {
        this.structuralSignatures.clear();
        this.pendingRegions.clear();
        this.baselineLoaded = false;
        this.lastSnapshots = null;
        this.lastSyncedSnapshots = null;
        LOGGER.info("[Millénaire-BlueMap] État interne du service BlueMap réinitialisé.");
    }

    public void register() {
        BlueMapAPI.onEnable(this::onBlueMapEnabled);
        BlueMapAPI.onDisable(this::onBlueMapDisabled);
    }

    private void onBlueMapEnabled(BlueMapAPI api) {
        this.blueMapApi = api;
        this.lastSyncedSnapshots = null;
        LOGGER.info("BlueMap API v{} enabled. Initializing Millénaire MarkerSets...", api.getBlueMapVersion());

        Consumer<Path> listener = this.webRootListener;
        if (listener != null && api.getWebApp() != null && api.getWebApp().getWebRoot() != null) {
            listener.accept(api.getWebApp().getWebRoot());
        }

        for (BlueMapMap map : api.getMaps()) {
            initMarkerSets(map);
        }

        // Register custom frontend assets
        api.getWebApp().registerScript("js/millenaire_panel.js");
        api.getWebApp().registerStyle("css/millenaire_panel.css");

        // If snapshots were already captured before BlueMap finished loading, push them immediately
        List<VillageSnapshotDTO> cached = this.lastSnapshots;
        if (cached != null && !cached.isEmpty()) {
            syncMarkers(cached);
        }

        // Flush any pending region render requests that accumulated before BlueMap was ready
        if (!this.pendingRegions.isEmpty()) {
            schedulePendingRegionRender();
        }
    }

    private boolean isOverworldMap(BlueMapMap map) {
        String mapId = map.getId() != null ? map.getId().toLowerCase() : "";
        String worldId = (map.getWorld() != null && map.getWorld().getId() != null)
            ? map.getWorld().getId().toLowerCase()
            : "";

        if (mapId.contains("nether") || mapId.contains("the_end") || mapId.endsWith("_end")
            || worldId.contains("nether") || worldId.contains("the_end") || worldId.endsWith("_end")) {
            return false;
        }
        return true;
    }

    private void initMarkerSets(BlueMapMap map) {
        if (!isOverworldMap(map)) {
            LOGGER.debug("Skipping Millénaire MarkerSet registration for non-Overworld map: {}", map.getId());
            return;
        }

        map.getMarkerSets().computeIfAbsent(VILLAGE_SET_ID, k ->
            MarkerSet.builder()
                .label("Millénaire - Villages & Zones")
                .toggleable(true)
                .defaultHidden(false)
                .build()
        );

        map.getMarkerSets().computeIfAbsent(DIPLOMACY_SET_ID, k ->
            MarkerSet.builder()
                .label("Millénaire - Diplomatie & Relations")
                .toggleable(true)
                .defaultHidden(false)
                .build()
        );
    }

    public synchronized void syncMarkers(List<VillageSnapshotDTO> snapshots) {
        this.lastSnapshots = snapshots;
        BlueMapAPI api = this.blueMapApi;
        if (api == null || snapshots == null) {
            return;
        }
        if (snapshots.equals(this.lastSyncedSnapshots)) {
            return;
        }

        for (BlueMapMap map : api.getMaps()) {
            if (!isOverworldMap(map)) {
                continue;
            }
            initMarkerSets(map);

            MarkerSet villageSet = map.getMarkerSets().get(VILLAGE_SET_ID);
            MarkerSet diploSet = map.getMarkerSets().get(DIPLOMACY_SET_ID);
            if (villageSet == null || diploSet == null) {
                continue;
            }

            Set<String> activeVillageMarkers = new HashSet<>();
            Set<String> activeDiploMarkers = new HashSet<>();
            Set<String> processedPairs = new HashSet<>();

            for (VillageSnapshotDTO v : snapshots) {
                String uuidStr = v.id().toString();
                String zoneId = "zone_" + uuidStr;
                String badgeId = "badge_" + uuidStr;

                ExtrudeMarker zoneMarker = VillageZoneMarkerBuilder.buildZone(v);
                HtmlMarker badgeMarker = VillageCenterMarkerBuilder.buildBadge(v);

                villageSet.put(zoneId, zoneMarker);
                villageSet.put(badgeId, badgeMarker);
                activeVillageMarkers.add(zoneId);
                activeVillageMarkers.add(badgeId);

                if (v.relations() != null) {
                    for (DiplomaticRelationDTO rel : v.relations()) {
                        // Only render non-neutral relations in 3D to avoid visual clutter ("spaghetti map")
                        if (rel.score() == 0) {
                            continue;
                        }
                        String pairKey = canonicalPairKey(rel.sourceVillageId(), rel.targetVillageId());
                        if (!processedPairs.add(pairKey)) {
                            continue;
                        }

                        String lineId = "rel_" + pairKey;
                        LineMarker arc = DiplomaticLineMarkerBuilder.buildArc(rel);
                        if (arc != null) {
                            diploSet.put(lineId, arc);
                            activeDiploMarkers.add(lineId);
                        }

                        String iconId = "rel_icon_" + pairKey;
                        HtmlMarker midBadge = DiplomaticLineMarkerBuilder.buildMidpointBadge(rel);
                        if (midBadge != null) {
                            diploSet.put(iconId, midBadge);
                            activeDiploMarkers.add(iconId);
                        }
                    }
                }
            }

            // Prune deleted/stale markers atomically
            villageSet.getMarkers().keySet().removeIf(k -> !activeVillageMarkers.contains(k));
            diploSet.getMarkers().keySet().removeIf(k -> !activeDiploMarkers.contains(k));
        }

        this.lastSyncedSnapshots = snapshots;
    }

    /**
     * Detects if any village was newly created or had a building completed/upgraded
     * since the previous tick cycle, and returns the MCA region coordinates (r.X.Z.mca)
     * that should be flushed to disk and re-rendered by BlueMap.
     */
    public Set<Vector2i> detectChangedRegions(List<VillageSnapshotDTO> snapshots) {
        if (snapshots == null) {
            return Set.of();
        }
        Set<Vector2i> regionsToUpdate = new HashSet<>();
        Set<UUID> currentIds = new HashSet<>();
        boolean isFirstLoad = !this.baselineLoaded;

        for (VillageSnapshotDTO v : snapshots) {
            currentIds.add(v.id());
            String sig = computeStructuralSignature(v);
            String previousSig = structuralSignatures.put(v.id(), sig);

            if (!isFirstLoad && !sig.equals(previousSig)) {
                Set<Vector2i> villageRegions = new HashSet<>();
                int minRegionX = ((int) Math.floor(v.boundsMinX())) >> 9;
                int maxRegionX = ((int) Math.ceil(v.boundsMaxX())) >> 9;
                int minRegionZ = ((int) Math.floor(v.boundsMinZ())) >> 9;
                int maxRegionZ = ((int) Math.ceil(v.boundsMaxZ())) >> 9;

                for (int rx = minRegionX; rx <= maxRegionX; rx++) {
                    for (int rz = minRegionZ; rz <= maxRegionZ; rz++) {
                        villageRegions.add(new Vector2i(rx, rz));
                    }
                }
                regionsToUpdate.addAll(villageRegions);
                this.pendingRegions.addAll(villageRegions);
                LOGGER.info("[Millénaire-BlueMap] Changement structurel détecté dans '{}' ({}) -> {} région(s) planifiée(s) pour recartographie BlueMap.",
                    v.name(), previousSig == null ? "Nouveau village" : "Nouveau bâtiment / niveau", villageRegions.size());
            }
        }

        structuralSignatures.keySet().retainAll(currentIds);
        if (isFirstLoad) {
            this.baselineLoaded = true;
        }
        return regionsToUpdate;
    }

    public void scheduleRegionRender(Set<Vector2i> regionsToUpdate) {
        if (regionsToUpdate != null && !regionsToUpdate.isEmpty()) {
            this.pendingRegions.addAll(regionsToUpdate);
        }
        schedulePendingRegionRender();
    }

    public synchronized void schedulePendingRegionRender() {
        if (this.pendingRegions.isEmpty()) {
            return;
        }
        BlueMapAPI api = this.blueMapApi;
        if (api == null) {
            LOGGER.debug("[Millénaire-BlueMap] BlueMapAPI pas encore prête, {} région(s) conservée(s) en file d'attente.", this.pendingRegions.size());
            return;
        }
        Set<Vector2i> toRender = new HashSet<>(this.pendingRegions);
        this.pendingRegions.removeAll(toRender);

        for (BlueMapMap map : api.getMaps()) {
            if (!isOverworldMap(map)) {
                continue;
            }
            boolean scheduled = api.getRenderManager().scheduleMapUpdateTask(map, toRender, false);
            LOGGER.info("[Millénaire-BlueMap] Recartographie BlueMap planifiée sur la carte '{}' pour les régions {} (accepté={})",
                map.getId(), toRender, scheduled);
        }
    }

    private static String computeStructuralSignature(VillageSnapshotDTO v) {
        StringBuilder sb = new StringBuilder();
        sb.append((int) v.boundsMinX()).append(',').append((int) v.boundsMinZ()).append(':')
          .append((int) v.boundsMaxX()).append(',').append((int) v.boundsMaxZ()).append('|');
        if (v.buildingsList() != null) {
            for (BuildingSnapshotDTO b : v.buildingsList()) {
                if (!b.isUnderConstruction()) {
                    sb.append(b.planId())
                      .append('@')
                      .append(b.x()).append(',').append(b.y()).append(',').append(b.z())
                      .append('#')
                      .append(b.level())
                      .append(';');
                }
            }
        }
        return sb.toString();
    }

    private static String canonicalPairKey(UUID a, UUID b) {
        String sa = a.toString();
        String sb = b.toString();
        return sa.compareTo(sb) <= 0 ? (sa + "_" + sb) : (sb + "_" + sa);
    }

    private void onBlueMapDisabled(BlueMapAPI api) {
        LOGGER.info("BlueMap API disabled. Disposing Millénaire MarkerSets...");
        this.blueMapApi = null;
        this.lastSyncedSnapshots = null;
    }
}
