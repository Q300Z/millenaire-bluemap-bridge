package org.millenaire.bridge.extractor;

import net.minecraft.core.BlockPos;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.Identifier;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.item.Item;
import net.minecraft.world.phys.AABB;
import org.millenaire.bridge.dto.*;
import org.millenaire.bridge.util.MillenaireTranslationHelper;
import org.millenaire.building.AnywoodHelper;
import org.millenaire.building.BuildingId;
import org.millenaire.building.BuildingInstance;
import org.millenaire.building.BuildingInventory;
import org.millenaire.building.BuildingPlanSet;
import org.millenaire.building.ConstructionTask;
import org.millenaire.culture.Culture;
import org.millenaire.culture.Gender;
import org.millenaire.culture.ModCultures;
import org.millenaire.culture.VillageType;
import org.millenaire.culture.VillagerType;
import org.millenaire.village.Village;
import org.millenaire.village.Village.PendingProject;
import org.millenaire.village.VillageId;
import org.millenaire.village.VillageManager;
import org.millenaire.village.VillageSavedData;
import org.millenaire.village.VillagerRecord;

import java.util.*;

public class VillageDataExtractor {

    private static final byte CAT_OTHER = 0;
    private static final byte CAT_WOOD = 1;
    private static final byte CAT_STONE = 2;
    private static final byte CAT_FOOD = 3;
    private static final byte CAT_CURRENCY_GOLD = 4;
    private static final byte CAT_CURRENCY_SILVER = 5;
    private static final byte CAT_CURRENCY_COPPER = 6;
    private final Map<Item, Byte> itemCategoryCache = new java.util.concurrent.ConcurrentHashMap<>();

    public List<VillageSnapshotDTO> extractSnapshots(ServerLevel overworld) {
        if (overworld == null) {
            return Collections.emptyList();
        }

        VillageSavedData savedData = VillageSavedData.get(overworld);
        if (savedData == null || savedData.getVillageManager() == null) {
            return Collections.emptyList();
        }

        VillageManager manager = savedData.getVillageManager();
        Collection<Village> allVillages = manager.getAllVillages();
        if (allVillages == null || allVillages.isEmpty()) {
            return Collections.emptyList();
        }

        // Index all villages by VillageId for fast bilateral relation lookup
        Map<VillageId, Village> villageIndex = new HashMap<>(allVillages.size() * 2);
        for (Village v : allVillages) {
            if (v != null && v.getId() != null) {
                villageIndex.put(v.getId(), v);
            }
        }

        List<VillageSnapshotDTO> snapshots = new ArrayList<>(allVillages.size());

        for (Village village : allVillages) {
            if (village == null || village.getId() == null || village.getCenter() == null) {
                continue;
            }

            UUID villageUuid = village.getId().uuid();
            String villageName = village.getVillageName() != null ? village.getVillageName() : "Village";
            Identifier cultureIdent = village.getCultureId();
            String cultureIdStr = cultureIdent != null ? cultureIdent.toString() : "millenaire:norman";
            Culture cultureObj = cultureIdent != null ? ModCultures.getCulture(cultureIdent) : null;
            String cultureDisplayName = MillenaireTranslationHelper.translateCulture(
                cultureIdStr,
                cultureObj != null ? cultureObj.displayName() : null
            );

            Identifier vTypeIdent = village.getVillageTypeId();
            String vTypeIdStr = vTypeIdent != null ? vTypeIdent.toString() : "";
            VillageType vTypeObj = vTypeIdent != null ? ModCultures.getVillageType(vTypeIdent) : null;
            String vTypeName = (vTypeObj != null && vTypeObj.name() != null && !vTypeObj.name().isBlank())
                ? vTypeObj.name()
                : (vTypeIdStr.contains("/") ? vTypeIdStr.substring(vTypeIdStr.indexOf('/') + 1) : "Village");

            boolean isLone = village.isLoneBuilding();
            BlockPos center = village.getCenter();

            // Bounds calculation
            AABB bounds = village.computeBounds();
            double minX, minY, minZ, maxX, maxY, maxZ;
            if (bounds != null && !bounds.isInfinite() && !bounds.hasNaN() && bounds.getXsize() > 1.0) {
                minX = bounds.minX;
                minY = bounds.minY;
                minZ = bounds.minZ;
                maxX = bounds.maxX;
                maxY = bounds.maxY;
                maxZ = bounds.maxZ;
            } else {
                minX = center.getX() - 16.0;
                minY = center.getY() - 4.0;
                minZ = center.getZ() - 16.0;
                maxX = center.getX() + 16.0;
                maxY = center.getY() + 12.0;
                maxZ = center.getZ() + 16.0;
            }

            // Buildings, Projects & Cached Chest Inventories
            List<BuildingInstance> buildings = village.getBuildings();
            Map<BuildingId, String> buildingNamesById = new HashMap<>();
            List<BuildingSnapshotDTO> buildingsList = new ArrayList<>();
            List<ProjectSnapshotDTO> projects = new ArrayList<>();
            List<BuildingInstance> activeProjects = new ArrayList<>();
            Map<Item, Integer> aggregatedItems = new HashMap<>();
            int mainBuildingsCount = 0;

            double bMinX = Double.MAX_VALUE;
            double bMaxX = -Double.MAX_VALUE;
            double bMinZ = Double.MAX_VALUE;
            double bMaxZ = -Double.MAX_VALUE;
            boolean hasBuildingBounds = false;

            if (buildings != null) {
                for (BuildingInstance b : buildings) {
                    if (b == null) continue;
                    Identifier planSetId = b.getPlanSetId();
                    String planSetStr = planSetId != null ? planSetId.toString() : (b.getPlanId() != null ? b.getPlanId().toString() : "Bâtiment");
                    BuildingPlanSet planSet = planSetId != null ? ModCultures.getBuildingPlanSet(planSetId) : null;
                    String bName = MillenaireTranslationHelper.translateBuilding(
                        planSetStr,
                        planSet != null ? planSet.nativeName() : null
                    );

                    if (b.getId() != null) {
                        buildingNamesById.put(b.getId(), bName);
                    }

                    BlockPos pos = b.getOrigin();
                    if (pos != null && b.getCachedMaxX() >= b.getCachedMinX() && b.getCachedMaxZ() >= b.getCachedMinZ()) {
                        bMinX = Math.min(bMinX, pos.getX() + b.getCachedMinX());
                        bMaxX = Math.max(bMaxX, pos.getX() + b.getCachedMaxX());
                        bMinZ = Math.min(bMinZ, pos.getZ() + b.getCachedMinZ());
                        bMaxZ = Math.max(bMaxZ, pos.getZ() + b.getCachedMaxZ());
                        hasBuildingBounds = true;
                    }

                    BlockPos origin = pos != null ? pos : center;
                    if (!b.isSubBuilding() && !b.isWallSegment()) {
                        mainBuildingsCount++;
                        buildingsList.add(new BuildingSnapshotDTO(
                            b.getId() != null ? b.getId().uuid().toString() : "",
                            bName,
                            planSetStr,
                            b.getLevel(),
                            origin.getX(),
                            origin.getY(),
                            origin.getZ(),
                            b.isBeingBuilt(),
                            b.isSubBuilding()
                        ));
                    }

                    if (b.isBeingBuilt() && !b.isWallSegment()) {
                        activeProjects.add(b);
                    }

                    BuildingInventory inv = b.getInventory();
                    if (inv != null) {
                        Map<Item, Integer> cached = inv.getCachedContents();
                        if (cached == null && overworld != null && b.getOrigin() != null && overworld.isLoaded(b.getOrigin())) {
                            try {
                                inv.scanChests(overworld);
                                cached = inv.getCachedContents();
                            } catch (Exception ignored) {
                            }
                        }
                        if (cached != null && !cached.isEmpty()) {
                            for (Map.Entry<Item, Integer> entry : cached.entrySet()) {
                                if (entry.getKey() != null && entry.getValue() != null && entry.getValue() > 0) {
                                    aggregatedItems.merge(entry.getKey(), entry.getValue(), Integer::sum);
                                }
                            }
                        }
                    }
                }
            }

            if (hasBuildingBounds) {
                minX = bMinX - 8.0;
                maxX = bMaxX + 8.0;
                minZ = bMinZ - 8.0;
                maxZ = bMaxZ + 8.0;
            }

            for (BuildingInstance b : activeProjects) {
                String bName = buildingNamesById.getOrDefault(b.getId(), "Bâtiment");
                ConstructionTask task = b.getConstructionTask();
                double progress = task != null ? task.progress() : 0.0;
                int step = task != null ? task.getNextStepIndex() : 0;
                int totalSteps = task != null ? task.totalSteps() : 1;
                boolean blocked = task != null && task.isBlocked();
                List<RequiredResourceDTO> reqRes = resolveRequiredResources(b.getPlanSetId(), b.getVariant(), b.getLevel(), aggregatedItems);
                projects.add(new ProjectSnapshotDTO(bName, progress, step, totalSteps, blocked, reqRes));
            }

            if (projects.isEmpty()) {
                PendingProject pp = village.getPendingProject();
                if (pp != null && pp.planSetId() != null) {
                    String pendingName = MillenaireTranslationHelper.translateBuilding(pp.planSetId().toString(), null);
                    List<RequiredResourceDTO> reqRes = resolveRequiredResources(pp.planSetId(), pp.variant(), pp.level(), aggregatedItems);
                    projects.add(new ProjectSnapshotDTO(pendingName, 0.0, 0, 100, false, reqRes));
                }
            }

            // Villagers & Demographics
            Map<UUID, VillagerRecord> recordsMap = village.getVillagerRecords();
            List<VillagerSnapshotDTO> roster = new ArrayList<>();
            int men = 0;
            int women = 0;
            int children = 0;

            if (recordsMap != null) {
                for (VillagerRecord rec : recordsMap.values()) {
                    if (rec == null) continue;
                    if (rec.isRaidingVillage()) continue;
                    Identifier vTypeId = rec.getVillagerTypeId();
                    VillagerType vType = vTypeId != null ? ModCultures.getVillagerType(vTypeId) : null;
                    if (vType != null && (vType.hasTag("foreignmerchant") || vType.hasTag("localmerchant"))) continue;

                    boolean isChild = vType != null && vType.isChild();
                    if (!rec.isKilled()) {
                        if (isChild) {
                            children++;
                        } else if (vType != null && vType.gender() == Gender.FEMALE) {
                            women++;
                        } else {
                            men++;
                        }
                    }

                    String firstName = rec.getFirstName() != null ? rec.getFirstName() : "";
                    String familyName = rec.getFamilyName() != null ? rec.getFamilyName() : "";
                    String fullName = (firstName + " " + familyName).trim();
                    if (fullName.isEmpty()) {
                        fullName = "Villageois";
                    }

                    String roleLabel = MillenaireTranslationHelper.translateRole(
                        rec.getRoleName(),
                        vTypeId != null ? vTypeId.toString() : null,
                        vType != null ? vType.nativeName() : null
                    );

                    String homeName = rec.getHomeBuilding() != null
                        ? buildingNamesById.getOrDefault(rec.getHomeBuilding(), "")
                        : "";

                    boolean isCombatant = !isChild && vType != null && (
                        vType.isHelpInAttacks() || vType.isDefensive() || vType.isRaider() || vType.isArcher()
                    );
                    int milStrength = isCombatant ? rec.getMilitaryStrength() : 0;
                    boolean isRaiding = rec.isAwayRaiding();

                    roster.add(new VillagerSnapshotDTO(
                        rec.getUuid(),
                        fullName,
                        roleLabel,
                        homeName,
                        isCombatant,
                        isRaiding,
                        rec.isAwayHired(),
                        rec.isKilled(),
                        milStrength
                    ));
                }
            }

            int totalPop = men + women + children;
            StockpileDTO stockpiles = buildStockpileDTO(aggregatedItems);

            // Diplomatic Relations (including symmetric lookup)
            Map<VillageId, Integer> combinedRelations = new LinkedHashMap<>();
            if (village.getRelations() != null) {
                combinedRelations.putAll(village.getRelations());
            }
            for (Village other : allVillages) {
                if (other != null && other.getId() != null && !other.getId().equals(village.getId()) && other.getRelations() != null) {
                    Integer reverseScore = other.getRelations().get(village.getId());
                    if (reverseScore != null && !combinedRelations.containsKey(other.getId())) {
                        combinedRelations.put(other.getId(), reverseScore);
                    }
                }
            }

            List<DiplomaticRelationDTO> relationDTOs = new ArrayList<>();
            for (Map.Entry<VillageId, Integer> relEntry : combinedRelations.entrySet()) {
                VillageId targetId = relEntry.getKey();
                int score = relEntry.getValue() != null ? relEntry.getValue() : 0;
                Village targetVillage = villageIndex.get(targetId);
                if (targetVillage == null || targetVillage.getCenter() == null) {
                    continue;
                }

                BlockPos targetCenter = targetVillage.getCenter();
                double dx = targetCenter.getX() - center.getX();
                double dz = targetCenter.getZ() - center.getZ();
                double dist = Math.sqrt(dx * dx + dz * dz);

                String targetCultId = targetVillage.getCultureId() != null ? targetVillage.getCultureId().toString() : "";
                String targetCultName = MillenaireTranslationHelper.translateCulture(targetCultId, targetCultId);

                relationDTOs.add(new DiplomaticRelationDTO(
                    villageUuid,
                    villageName,
                    new DiplomaticRelationDTO.CenterPos(center.getX(), center.getY(), center.getZ()),
                    targetId.uuid(),
                    targetVillage.getVillageName() != null ? targetVillage.getVillageName() : "Village",
                    targetCultName,
                    new DiplomaticRelationDTO.CenterPos(targetCenter.getX(), targetCenter.getY(), targetCenter.getZ()),
                    score,
                    MillenaireTranslationHelper.translateRelationStatus(score),
                    MillenaireTranslationHelper.getRelationColorHex(score),
                    dist
                ));
            }

            VillageId raidTargetId = village.getRaidTarget();
            Village raidTargetVillage = raidTargetId != null ? villageIndex.get(raidTargetId) : null;
            String raidTargetName = raidTargetVillage != null ? raidTargetVillage.getVillageName() : null;

            snapshots.add(new VillageSnapshotDTO(
                villageUuid,
                villageName,
                cultureIdStr,
                cultureDisplayName,
                vTypeIdStr,
                vTypeName,
                isLone,
                center.getX(),
                center.getY(),
                center.getZ(),
                minX,
                minY,
                minZ,
                maxX,
                maxY,
                maxZ,
                totalPop,
                men,
                women,
                children,
                village.getVillageDefendingStrength(),
                village.getVillageRaidingStrength(),
                village.isUnderAttack(),
                raidTargetName,
                mainBuildingsCount,
                roster,
                buildingsList,
                projects,
                stockpiles,
                relationDTOs
            ));
        }

        return snapshots;
    }

    private StockpileDTO buildStockpileDTO(Map<Item, Integer> items) {
        int gold = 0;
        int silver = 0;
        int copper = 0;
        int totalWood = 0;
        int totalStone = 0;
        int totalFood = 0;
        Map<String, Integer> materials = new LinkedHashMap<>();
        Map<String, Integer> foods = new LinkedHashMap<>();

        for (Map.Entry<Item, Integer> entry : items.entrySet()) {
            Item item = entry.getKey();
            int count = entry.getValue();
            if (item == null || count <= 0) continue;

            byte cat = itemCategoryCache.computeIfAbsent(item, this::computeCategory);
            if (cat == CAT_OTHER) continue;

            if (cat == CAT_CURRENCY_GOLD) {
                gold += count;
            } else if (cat == CAT_CURRENCY_SILVER) {
                silver += count;
            } else if (cat == CAT_CURRENCY_COPPER) {
                copper += count;
            } else {
                Identifier id = BuiltInRegistries.ITEM.getKey(item);
                String idStr = id != null ? id.toString() : "";
                String label = MillenaireTranslationHelper.translateItem(item.getDescriptionId(), idStr);
                if (cat == CAT_FOOD) {
                    totalFood += count;
                    foods.merge(label, count, Integer::sum);
                } else if (cat == CAT_WOOD) {
                    totalWood += count;
                    materials.merge(label, count, Integer::sum);
                } else if (cat == CAT_STONE) {
                    totalStone += count;
                    materials.merge(label, count, Integer::sum);
                }
            }
        }

        return new StockpileDTO(gold, silver, copper, totalWood, totalStone, totalFood, materials, foods);
    }

    private byte computeCategory(Item item) {
        if (item == null) return CAT_OTHER;
        Identifier id = BuiltInRegistries.ITEM.getKey(item);
        String path = id != null ? id.getPath().toLowerCase(Locale.ROOT) : "";
        if (path.equals("denier_or")) return CAT_CURRENCY_GOLD;
        if (path.equals("denier_argent")) return CAT_CURRENCY_SILVER;
        if (path.equals("denier")) return CAT_CURRENCY_COPPER;
        if (isFoodItem(item, path)) return CAT_FOOD;
        if (isWoodItem(path)) return CAT_WOOD;
        if (isStoneOrMaterialItem(path)) return CAT_STONE;
        return CAT_OTHER;
    }

    private boolean isWoodItem(String path) {
        if (path == null || path.isEmpty()) return false;
        if (path.contains("sapling") || path.contains("pousse") || path.contains("sword")
            || path.contains("pickaxe") || path.contains("axe") || path.contains("shovel")
            || path.contains("hoe") || path.contains("bow") || path.contains("shield")
            || path.contains("door") || path.contains("trapdoor") || path.contains("sign")
            || path.contains("boat") || path.contains("chest") || path.contains("stick")
            || path.contains("bowl")) {
            return false;
        }
        return path.contains("_log") || path.contains("_wood") || path.contains("_planks")
            || path.contains("timberframe") || path.contains("timber_frame") || path.contains("stripped_");
    }

    private boolean isStoneOrMaterialItem(String path) {
        if (path == null || path.isEmpty()) return false;
        if (path.contains("sword") || path.contains("pickaxe") || path.contains("axe")
            || path.contains("shovel") || path.contains("hoe") || path.contains("helmet")
            || path.contains("chestplate") || path.contains("leggings") || path.contains("boots")
            || path.contains("apple") || path.contains("carrot") || path.contains("melon")
            || path.contains("horse_armor") || path.contains("nugget") || path.contains("sapling")
            || path.contains("seed")) {
            return false;
        }
        return path.contains("stone") || path.contains("cobble") || path.contains("brick")
            || path.contains("sand") || path.contains("tile") || path.contains("glass")
            || path.contains("iron") || path.contains("gold") || path.contains("dirt_wall")
            || path.contains("clay") || path.contains("terracotta") || path.contains("gravel")
            || path.contains("dirt") || path.contains("mud");
    }

    private boolean isFoodItem(Item item, String path) {
        if (path == null || path.isEmpty()) return false;
        if (path.contains("seed") || path.contains("sapling") || path.contains("leggings") || path.contains("spawn_egg")) {
            return false;
        }
        if (item != null) {
            try {
                if (item.components() != null && item.components().has(DataComponents.FOOD)) {
                    return true;
                }
            } catch (Throwable ignored) {
            }
        }
        if (path.equals("wheat") || path.equals("beetroot") || path.equals("egg")) {
            return true;
        }
        return path.contains("bread") || path.contains("beef") || path.contains("pork")
            || path.contains("chicken") || path.contains("mutton") || path.contains("rabbit")
            || path.contains("cod") || path.contains("salmon") || path.contains("fish")
            || path.contains("apple") || path.contains("carrot") || path.contains("potato")
            || path.contains("beetroot") || path.contains("cheese") || path.contains("feta")
            || path.contains("cidre") || path.contains("cider") || path.contains("calva")
            || path.contains("wine") || path.contains("malvasia") || path.contains("ouzo")
            || path.contains("sake") || path.contains("masa") || path.contains("wah")
            || path.contains("cacauhaa") || path.contains("curry") || path.contains("rasgulla")
            || path.contains("ayran") || path.contains("pide") || path.contains("lokum")
            || path.contains("helva") || path.contains("yogurt") || path.contains("olives")
            || path.contains("olive_oil") || path.contains("dates") || path.contains("figs")
            || path.contains("pistachios") || path.contains("cherries") || path.contains("boudin")
            || path.contains("tripes") || path.contains("ikura") || path.contains("udon")
            || path.contains("ize") || path.contains("maize") || path.contains("rice")
            || path.contains("souvlaki");
    }

    private List<RequiredResourceDTO> resolveRequiredResources(Identifier planSetId, String variant, int level, Map<Item, Integer> aggregatedItems) {
        if (planSetId == null) return Collections.emptyList();
        try {
            BuildingPlanSet planSet = ModCultures.getBuildingPlanSet(planSetId);
            if (planSet == null) return Collections.emptyList();

            BuildingPlanSet.LevelDef levelDef = planSet.getLevel(variant != null ? variant : "a", level);
            if (levelDef == null || levelDef.requiredResources() == null || levelDef.requiredResources().isEmpty()) {
                return Collections.emptyList();
            }

            List<RequiredResourceDTO> list = new ArrayList<>();
            for (Map.Entry<Identifier, Integer> entry : levelDef.requiredResources().entrySet()) {
                Identifier resId = entry.getKey();
                int required = entry.getValue() != null ? entry.getValue() : 0;
                if (resId == null || required <= 0) continue;

                int available = getAvailableCount(resId, aggregatedItems);
                String itemName;
                if (AnywoodHelper.isAnywood(resId)) {
                    itemName = "Bûches (tout type)";
                } else {
                    Item item = BuiltInRegistries.ITEM.getValue(resId);
                    if (item != null && item != net.minecraft.world.item.Items.AIR) {
                        itemName = MillenaireTranslationHelper.translateItem(item.getDescriptionId(), resId.toString());
                    } else {
                        itemName = MillenaireTranslationHelper.translateItem(null, resId.toString());
                    }
                }
                list.add(new RequiredResourceDTO(resId.toString(), itemName, required, available));
            }
            return list;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private int getAvailableCount(Identifier resId, Map<Item, Integer> aggregatedItems) {
        if (resId == null) return 0;
        if (AnywoodHelper.isAnywood(resId)) {
            int totalLogs = 0;
            for (Map.Entry<Item, Integer> entry : aggregatedItems.entrySet()) {
                Item item = entry.getKey();
                if (item != null) {
                    Identifier itemId = BuiltInRegistries.ITEM.getKey(item);
                    if (itemId != null && (itemId.getPath().endsWith("_log") || itemId.getPath().endsWith("_wood") || AnywoodHelper.isLogResourceLocation(itemId))) {
                        totalLogs += entry.getValue();
                    }
                }
            }
            return totalLogs;
        }

        Item item = BuiltInRegistries.ITEM.getValue(resId);
        if (item != null && item != net.minecraft.world.item.Items.AIR) {
            return aggregatedItems.getOrDefault(item, 0);
        }
        return 0;
    }
}
