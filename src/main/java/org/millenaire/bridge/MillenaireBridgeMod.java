package org.millenaire.bridge;

import com.flowpowered.math.vector.Vector2i;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.Mod;
import net.neoforged.neoforge.common.NeoForge;
import net.neoforged.neoforge.event.server.ServerStartedEvent;
import net.neoforged.neoforge.event.server.ServerStoppingEvent;
import net.neoforged.neoforge.event.server.ServerStoppedEvent;
import net.neoforged.neoforge.event.tick.ServerTickEvent;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.millenaire.bridge.bluemap.BlueMapIntegrationService;
import org.millenaire.bridge.dto.VillageSnapshotDTO;
import org.millenaire.bridge.exporter.AtomicJsonExporter;
import org.millenaire.bridge.extractor.VillageDataExtractor;
import org.millenaire.bridge.installer.WebAssetAutoInstaller;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Mod(MillenaireBridgeMod.MOD_ID)
public class MillenaireBridgeMod {
    public static final String MOD_ID = "millenaire_bluemap";
    private static final Logger LOGGER = LogManager.getLogger();
    private static final long CHUNK_FLUSH_COOLDOWN_MS = 15_000L;
    private static final long REGION_RENDER_DELAY_MS = 2_500L;

    private final BlueMapIntegrationService blueMapService;
    private final VillageDataExtractor dataExtractor;
    private volatile AtomicJsonExporter jsonExporter;
    private final AtomicBoolean isExporting = new AtomicBoolean(false);
    private int tickCounter = 0;
    private long lastChunkFlushMs = 0L;

    public MillenaireBridgeMod() {
        this.blueMapService = new BlueMapIntegrationService();
        this.dataExtractor = new VillageDataExtractor();
        this.jsonExporter = new AtomicJsonExporter();

        this.blueMapService.setWebRootListener(webRoot ->
            this.jsonExporter = new AtomicJsonExporter(webRoot.resolve("data").resolve("millenaire_details.json"))
        );
        this.blueMapService.register();
        NeoForge.EVENT_BUS.register(this);
        
        // Auto-install and sync BlueMap web assets directly from this mod JAR
        WebAssetAutoInstaller.install();
        LOGGER.info("Millénaire BlueMap Integration Bridge v1.0.0 initialized.");
    }

    @SubscribeEvent
    public void onServerStarted(ServerStartedEvent event) {
        WebAssetAutoInstaller.install();
        triggerSync(event.getServer());
    }

    @SubscribeEvent
    public void onServerStopping(ServerStoppingEvent event) {
        LOGGER.info("Server stopping: shutting down Millénaire BlueMap tasks.");
        isExporting.set(true); // Prevent new sync cycles while shutting down
        this.blueMapService.resetState();
    }

    @SubscribeEvent
    public void onServerStopped(ServerStoppedEvent event) {
        this.lastChunkFlushMs = 0L;
        isExporting.set(false);
        this.blueMapService.resetState();
    }

    @SubscribeEvent
    public void onServerTick(ServerTickEvent.Post event) {
        if (++tickCounter % 100 == 0) { // Execute every 5 seconds (100 ticks)
            triggerSync(event.getServer());
        }
    }

    private void triggerSync(MinecraftServer server) {
        if (server == null) {
            return;
        }
        // Reentrancy guard: skip if background export or marker sync is still running
        if (!isExporting.compareAndSet(false, true)) {
            LOGGER.debug("Millénaire export cycle skipped: previous background export is still in progress.");
            return;
        }

        try {
            ServerLevel overworld = server.overworld();
            // Rapid extraction on main thread (< 0.15ms)
            // Strictly queries in-memory cached inventories via building.getInventory().getCachedContents()
            List<VillageSnapshotDTO> snapshots = dataExtractor.extractSnapshots(overworld);

            // Detect if a new village was generated or if a building finished construction or upgraded
            Set<Vector2i> changedRegions = blueMapService.detectChangedRegions(snapshots);

            // Offload geometry, JSON IO, and BlueMap RenderManager scheduling to worker thread
            CompletableFuture.runAsync(() -> {
                try {
                    blueMapService.syncMarkers(snapshots);
                    jsonExporter.export(snapshots);
                    if (!changedRegions.isEmpty()) {
                        CompletableFuture.runAsync(() -> {
                            try {
                                blueMapService.scheduleRegionRender(changedRegions);
                            } catch (Exception e) {
                                LOGGER.error("Error scheduling BlueMap region render", e);
                            }
                        }, CompletableFuture.delayedExecutor(REGION_RENDER_DELAY_MS, TimeUnit.MILLISECONDS));
                    }
                } catch (Exception e) {
                    LOGGER.error("Error during Millénaire BlueMap background sync", e);
                } finally {
                    isExporting.set(false);
                }
            });
        } catch (Exception e) {
            isExporting.set(false);
            LOGGER.error("Error extracting Millénaire snapshots on server thread", e);
        }
    }
}
