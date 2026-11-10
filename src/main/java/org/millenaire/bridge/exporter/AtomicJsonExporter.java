package org.millenaire.bridge.exporter;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.millenaire.bridge.dto.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AtomicJsonExporter {
    private static final Logger LOGGER = LogManager.getLogger();
    private static final Gson GSON = new GsonBuilder().disableHtmlEscaping().create();

    private volatile Path targetFile;
    private volatile Path tempFile;
    private volatile List<VillageSnapshotDTO> lastExportedSnapshots;

    public AtomicJsonExporter() {
        this(Paths.get("bluemap", "web", "data", "millenaire_details.json"));
    }

    public AtomicJsonExporter(Path targetFile) {
        setTargetFile(targetFile);
    }

    public synchronized void setTargetFile(Path targetFile) {
        this.targetFile = targetFile;
        this.tempFile = targetFile.resolveSibling(targetFile.getFileName().toString() + ".tmp");
    }

    public synchronized void export(List<VillageSnapshotDTO> snapshots) {
        if (snapshots == null) {
            return;
        }

        if (snapshots.equals(this.lastExportedSnapshots) && Files.exists(this.targetFile)) {
            return; // Skip redundant disk write
        }

        try {
            Path parentDir = targetFile.getParent();
            if (parentDir != null) {
                Files.createDirectories(parentDir);
            }

            Map<String, Object> root = new LinkedHashMap<>();
            root.put("timestamp", System.currentTimeMillis());
            root.put("world", "minecraft:overworld");

            List<Map<String, Object>> villagesJson = new ArrayList<>(snapshots.size());
            for (VillageSnapshotDTO v : snapshots) {
                Map<String, Object> vMap = new LinkedHashMap<>();
                vMap.put("id", v.id().toString());
                vMap.put("name", v.name());
                vMap.put("culture", v.cultureId());
                vMap.put("culture_name", v.cultureName());
                vMap.put("culture_key", v.cultureKey());
                vMap.put("village_type", v.villageTypeId());
                vMap.put("village_type_name", v.villageTypeName());
                vMap.put("village_type_key", v.villageTypeKey());
                vMap.put("village_type_lore_key", v.villageTypeLoreKey());
                vMap.put("is_lone_building", v.isLoneBuilding());

                Map<String, Integer> centerMap = new LinkedHashMap<>();
                centerMap.put("x", v.centerX());
                centerMap.put("y", v.centerY());
                centerMap.put("z", v.centerZ());
                vMap.put("center", centerMap);

                Map<String, Double> boundsMap = new LinkedHashMap<>();
                boundsMap.put("min_x", v.boundsMinX());
                boundsMap.put("min_y", v.boundsMinY());
                boundsMap.put("min_z", v.boundsMinZ());
                boundsMap.put("max_x", v.boundsMaxX());
                boundsMap.put("max_y", v.boundsMaxY());
                boundsMap.put("max_z", v.boundsMaxZ());
                vMap.put("bounds", boundsMap);

                // Population & Roster
                Map<String, Object> popMap = new LinkedHashMap<>();
                popMap.put("total", v.population());
                popMap.put("men", v.menCount());
                popMap.put("women", v.womenCount());
                popMap.put("children", v.childrenCount());

                List<Map<String, Object>> rosterList = new ArrayList<>();
                if (v.roster() != null) {
                    for (VillagerSnapshotDTO r : v.roster()) {
                        Map<String, Object> rMap = new LinkedHashMap<>();
                        rMap.put("uuid", r.uuid() != null ? r.uuid().toString() : "");
                        rMap.put("name", r.name());
                        rMap.put("role", r.role());
                        rMap.put("role_key", r.roleKey());
                        rMap.put("home_building", r.homeBuilding());
                        rMap.put("is_combatant", r.isCombatant());
                        rMap.put("is_raiding", r.isRaiding());
                        rMap.put("is_hired", r.isHired());
                        rMap.put("is_killed", r.isKilled());
                        rMap.put("military_strength", r.militaryStrength());
                        rosterList.add(rMap);
                    }
                }
                popMap.put("roster", rosterList);
                vMap.put("population", popMap);

                // Military
                Map<String, Object> milMap = new LinkedHashMap<>();
                milMap.put("defense_rating", v.defenseRating());
                milMap.put("raid_strength", v.raidStrength());
                milMap.put("is_under_attack", v.isUnderAttack());
                milMap.put("active_raid_target", v.activeRaidTarget());
                vMap.put("military", milMap);

                // Stockpiles
                StockpileDTO sp = v.stockpiles();
                Map<String, Object> stockMap = new LinkedHashMap<>();
                Map<String, Integer> deniersMap = new LinkedHashMap<>();
                deniersMap.put("gold", sp != null ? sp.goldDeniers() : 0);
                deniersMap.put("silver", sp != null ? sp.silverDeniers() : 0);
                deniersMap.put("copper", sp != null ? sp.copperDeniers() : 0);
                stockMap.put("deniers", deniersMap);

                Map<String, Integer> resTotals = new LinkedHashMap<>();
                resTotals.put("wood", sp != null ? sp.totalWood() : 0);
                resTotals.put("stone", sp != null ? sp.totalStone() : 0);
                resTotals.put("food", sp != null ? sp.totalFood() : 0);
                stockMap.put("resources", resTotals);

                stockMap.put("construction_materials", sp != null && sp.constructionMaterials() != null ? sp.constructionMaterials() : Map.of());
                stockMap.put("food_reserves", sp != null && sp.foodReserves() != null ? sp.foodReserves() : Map.of());
                vMap.put("stockpiles", stockMap);

                // Projects
                List<Map<String, Object>> projList = new ArrayList<>();
                if (v.projects() != null) {
                    for (ProjectSnapshotDTO p : v.projects()) {
                        Map<String, Object> pMap = new LinkedHashMap<>();
                        pMap.put("name", p.name());
                        pMap.put("progress", p.progress());
                        pMap.put("current_step", p.currentStep());
                        pMap.put("total_steps", p.totalSteps());
                        pMap.put("is_blocked", p.isBlocked());

                        List<Map<String, Object>> reqList = new ArrayList<>();
                        if (p.requiredResources() != null) {
                            for (org.millenaire.bridge.dto.RequiredResourceDTO res : p.requiredResources()) {
                                Map<String, Object> rMap = new LinkedHashMap<>();
                                rMap.put("item_id", res.itemId());
                                rMap.put("item_name", res.itemName());
                                rMap.put("required", res.required());
                                rMap.put("available", res.available());
                                reqList.add(rMap);
                            }
                        }
                        pMap.put("required_resources", reqList);
                        projList.add(pMap);
                    }
                }
                vMap.put("projects", projList);

                // Buildings list
                vMap.put("buildings_count", v.buildingsCount());
                List<Map<String, Object>> bldList = new ArrayList<>();
                if (v.buildingsList() != null) {
                    for (BuildingSnapshotDTO b : v.buildingsList()) {
                        Map<String, Object> bMap = new LinkedHashMap<>();
                        bMap.put("id", b.id());
                        bMap.put("name", b.name());
                        bMap.put("plan_id", b.planId());
                        bMap.put("plan_key", b.planKey());
                        bMap.put("level", b.level());
                        bMap.put("x", b.x());
                        bMap.put("y", b.y());
                        bMap.put("z", b.z());
                        bMap.put("is_under_construction", b.isUnderConstruction());
                        bldList.add(bMap);
                    }
                }
                vMap.put("buildings_list", bldList);

                // Diplomatic Relations
                List<Map<String, Object>> relList = new ArrayList<>();
                if (v.relations() != null) {
                    for (DiplomaticRelationDTO rel : v.relations()) {
                        Map<String, Object> relMap = new LinkedHashMap<>();
                        relMap.put("target_village_id", rel.targetVillageId().toString());
                        relMap.put("target_name", rel.targetName());
                        relMap.put("target_culture_name", rel.targetCultureName());
                        relMap.put("target_culture_key", rel.targetCultureKey());
                        relMap.put("score", rel.score());
                        relMap.put("status", rel.statusLabel());
                        relMap.put("status_key", rel.statusKey());
                        relMap.put("color_hex", rel.colorHex());
                        relMap.put("distance", Math.round(rel.distance() * 10.0) / 10.0);
                        relList.add(relMap);
                    }
                }
                vMap.put("relations", relList);

                villagesJson.add(vMap);
            }

            root.put("villages", villagesJson);

            String payload = GSON.toJson(root);
            Files.writeString(tempFile, payload, StandardCharsets.UTF_8);

            try {
                Files.move(tempFile, targetFile, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(tempFile, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }
            this.lastExportedSnapshots = new ArrayList<>(snapshots);
        } catch (IOException e) {
            LOGGER.error("Failed to atomically export Millénaire details JSON to {}", targetFile, e);
        }
    }
}
