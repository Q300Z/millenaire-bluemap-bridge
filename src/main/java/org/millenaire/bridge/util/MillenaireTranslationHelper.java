package org.millenaire.bridge.util;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class MillenaireTranslationHelper {
    private static final Logger LOGGER = LogManager.getLogger();
    private static final Map<String, String> FR_MAP = loadFrenchTranslations();
    private static final Map<String, String> VANILLA_FR_MAP = createVanillaFrenchMap();

    private MillenaireTranslationHelper() {}

    public static String escapeHtml(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&#39;");
    }

    private static Map<String, String> createVanillaFrenchMap() {
        Map<String, String> map = new HashMap<>();
        map.put("oak_log", "Bûche de chêne");
        map.put("spruce_log", "Bûche de sapin");
        map.put("birch_log", "Bûche de bouleau");
        map.put("jungle_log", "Bûche d'acajou");
        map.put("acacia_log", "Bûche d'acacia");
        map.put("dark_oak_log", "Bûche de chêne noir");
        map.put("mangrove_log", "Bûche de palétuvier");
        map.put("cherry_log", "Bûche de cerisier");
        map.put("oak_planks", "Planches de chêne");
        map.put("spruce_planks", "Planches de sapin");
        map.put("birch_planks", "Planches de bouleau");
        map.put("acacia_planks", "Planches d'acacia");
        map.put("oak_sapling", "Pousse de chêne");
        map.put("spruce_sapling", "Pousse de sapin");
        map.put("birch_sapling", "Pousse de bouleau");
        map.put("jungle_sapling", "Pousse d'acajou");
        map.put("acacia_sapling", "Pousse d'acacia");
        map.put("dark_oak_sapling", "Pousse de chêne noir");
        map.put("cobblestone", "Pierre taillée");
        map.put("stone", "Roche");
        map.put("smooth_stone", "Roche lisse");
        map.put("stone_bricks", "Pierre sculptée");
        map.put("mossy_cobblestone", "Pierre moussue");
        map.put("sand", "Sable");
        map.put("red_sand", "Sable rouge");
        map.put("sandstone", "Grès");
        map.put("chiseled_sandstone", "Grès sculpté");
        map.put("cut_sandstone", "Grès taillé");
        map.put("dirt", "Terre");
        map.put("coarse_dirt", "Terre stérile");
        map.put("gravel", "Gravier");
        map.put("clay", "Bloc d'argile");
        map.put("clay_ball", "Motte d'argile");
        map.put("brick", "Brique");
        map.put("bricks", "Briques");
        map.put("terracotta", "Terre cuite");
        map.put("glass", "Verre");
        map.put("glass_pane", "Vitre");
        map.put("iron_ingot", "Lingot de fer");
        map.put("iron_block", "Bloc de fer");
        map.put("gold_ingot", "Lingot d'or");
        map.put("gold_block", "Bloc d'or");
        map.put("copper_ingot", "Lingot de cuivre");
        map.put("coal", "Charbon");
        map.put("charcoal", "Charbon de bois");
        map.put("diamond", "Diamant");
        map.put("emerald", "Émeraude");
        map.put("wheat", "Blé");
        map.put("wheat_seeds", "Graines de blé");
        map.put("bread", "Pain");
        map.put("apple", "Pomme");
        map.put("golden_apple", "Pomme dorée");
        map.put("carrot", "Carotte");
        map.put("golden_carrot", "Carotte dorée");
        map.put("potato", "Pomme de terre");
        map.put("baked_potato", "Pomme de terre cuite");
        map.put("beetroot", "Betterave");
        map.put("beetroot_seeds", "Graines de betterave");
        map.put("beetroot_soup", "Soupe de betteraves");
        map.put("melon_slice", "Tranche de pastèque");
        map.put("pumpkin", "Citrouille");
        map.put("sugar_cane", "Canne à sucre");
        map.put("sugar", "Sucre");
        map.put("egg", "Œuf");
        map.put("milk_bucket", "Seau de lait");
        map.put("honey_bottle", "Fiole de miel");
        map.put("beef", "Bœuf cru");
        map.put("cooked_beef", "Steak");
        map.put("porkchop", "Porc cru");
        map.put("cooked_porkchop", "Côtelette de porc cuite");
        map.put("chicken", "Poulet cru");
        map.put("cooked_chicken", "Poulet rôti");
        map.put("mutton", "Mouton cru");
        map.put("cooked_mutton", "Mouton cuit");
        map.put("rabbit", "Lapin cru");
        map.put("cooked_rabbit", "Lapin cuit");
        map.put("cod", "Morue crue");
        map.put("cooked_cod", "Morue cuite");
        map.put("salmon", "Saumon cru");
        map.put("cooked_salmon", "Saumon cuit");
        map.put("tropical_fish", "Poisson tropical");
        map.put("white_wool", "Laine blanche");
        map.put("black_wool", "Laine noire");
        map.put("brown_wool", "Laine marron");
        map.put("gray_wool", "Laine grise");
        map.put("light_gray_wool", "Laine gris clair");
        map.put("red_wool", "Laine rouge");
        map.put("blue_wool", "Laine bleue");
        map.put("yellow_wool", "Laine jaune");
        map.put("green_wool", "Laine verte");
        map.put("orange_wool", "Laine orange");
        map.put("leather", "Cuir");
        map.put("feather", "Plume");
        map.put("bone", "Os");
        map.put("string", "Ficelle");
        map.put("stick", "Bâton");
        map.put("torch", "Torche");
        return Collections.unmodifiableMap(map);
    }

    private static Map<String, String> loadFrenchTranslations() {
        try {
            InputStream is = MillenaireTranslationHelper.class.getResourceAsStream("/assets/millenaire/lang/fr_fr.json");
            if (is == null) {
                is = org.millenaire.village.Village.class.getResourceAsStream("/assets/millenaire/lang/fr_fr.json");
            }
            if (is == null) {
                LOGGER.warn("Could not find /assets/millenaire/lang/fr_fr.json on classpath; using fallback labels.");
                return Collections.emptyMap();
            }
            try (InputStream stream = is) {
                Type type = new TypeToken<Map<String, String>>() {}.getType();
                Map<String, String> loaded = new Gson().fromJson(new InputStreamReader(stream, StandardCharsets.UTF_8), type);
                return loaded != null ? loaded : new HashMap<>();
            }
        } catch (Exception e) {
            LOGGER.warn("Failed to load Millénaire French translations", e);
            return Collections.emptyMap();
        }
    }

    public static String translateKey(String key, String fallback) {
        if (key == null || key.isBlank()) return fallback;
        String val = FR_MAP.get(key);
        return (val != null && !val.isBlank()) ? val : fallback;
    }

    public static String translateCulture(String cultureId, String fallbackDisplay) {
        if (cultureId == null) return fallbackDisplay != null ? fallbackDisplay : "Inconnu";
        String key = "culture." + cultureId.replace(':', '.');
        String translated = FR_MAP.get(key);
        if (translated != null && !translated.isBlank()) {
            return translated;
        }
        return switch (cultureId) {
            case "millenaire:norman" -> "Normand";
            case "millenaire:byzantines" -> "Byzantin";
            case "millenaire:japanese" -> "Japonais";
            case "millenaire:mayan" -> "Maya";
            case "millenaire:indian", "millenaire:hindi" -> "Indien";
            case "millenaire:inuits" -> "Inuit";
            case "millenaire:seljuk" -> "Seldjoukide";
            default -> fallbackDisplay != null ? fallbackDisplay : cultureId;
        };
    }

    public static String translateRole(String roleKey, String typeId, String nativeName) {
        if (roleKey != null && !roleKey.isBlank()) {
            String tr = FR_MAP.get(roleKey);
            if (tr != null && !tr.isBlank()) return tr;
        }
        if (typeId != null && !typeId.isBlank()) {
            // Convert "millenaire:norman/monk" -> "role.millenaire.norman_monk"
            String normalized = "role." + typeId.replace(':', '.').replace('/', '_');
            String tr = FR_MAP.get(normalized);
            if (tr != null && !tr.isBlank()) return tr;
        }
        if (nativeName != null && !nativeName.isBlank()) {
            return nativeName;
        }
        if (roleKey != null && !roleKey.isBlank() && !roleKey.startsWith("role.")) {
            return roleKey;
        }
        if (typeId != null && typeId.contains("/")) {
            return typeId.substring(typeId.indexOf('/') + 1);
        }
        return "Villageois";
    }

    public static String translateBuilding(String planSetId, String nativeName) {
        if (planSetId != null && !planSetId.isBlank()) {
            // Convert "millenaire:norman/abbey" -> "building.millenaire.norman.abbey"
            String key = "building." + planSetId.replace(':', '.').replace('/', '.');
            String tr = FR_MAP.get(key);
            if (tr != null && !tr.isBlank()) return tr;
        }
        if (nativeName != null && !nativeName.isBlank()) {
            return nativeName;
        }
        if (planSetId != null && planSetId.contains("/")) {
            return planSetId.substring(planSetId.indexOf('/') + 1);
        }
        return planSetId != null ? planSetId : "Bâtiment";
    }

    public static String translateItem(String descriptionId, String itemId) {
        if (descriptionId != null) {
            String tr = FR_MAP.get(descriptionId);
            if (tr != null && !tr.isBlank()) return tr;
        }
        if (itemId != null && itemId.contains(":")) {
            String[] parts = itemId.split(":", 2);
            String itemKey = "item." + parts[0] + "." + parts[1];
            String blockKey = "block." + parts[0] + "." + parts[1];
            if (FR_MAP.containsKey(itemKey)) return FR_MAP.get(itemKey);
            if (FR_MAP.containsKey(blockKey)) return FR_MAP.get(blockKey);
            if (VANILLA_FR_MAP.containsKey(parts[1])) return VANILLA_FR_MAP.get(parts[1]);
            return parts[1].replace('_', ' ');
        }
        if (itemId != null && VANILLA_FR_MAP.containsKey(itemId)) {
            return VANILLA_FR_MAP.get(itemId);
        }
        return itemId != null ? itemId : "Objet";
    }

    public static String translateRelationStatus(int score) {
        if (score >= 90) return translateKey("relation.millenaire.excellent", "Allié (Excellent)");
        if (score >= 70) return translateKey("relation.millenaire.verygood", "Allié (Très bon)");
        if (score >= 50) return translateKey("relation.millenaire.good", "Amical (Bon)");
        if (score >= 30) return translateKey("relation.millenaire.decent", "Cordial (Convenable)");
        if (score >= 10) return translateKey("relation.millenaire.fair", "Correct");
        if (score <= -90) return translateKey("relation.millenaire.openconflict", "Conflit ouvert");
        if (score <= -70) return translateKey("relation.millenaire.atrocious", "Atroce");
        if (score <= -50) return translateKey("relation.millenaire.verybad", "Hostile (Très mauvais)");
        if (score <= -30) return translateKey("relation.millenaire.bad", "Tendu (Mauvais)");
        if (score <= -10) return translateKey("relation.millenaire.chilly", "Frais");
        return translateKey("relation.millenaire.neutral", "Neutre");
    }

    public static String getRelationColorHex(int score) {
        if (score >= 70) return "#2ecc71";  // Green (Allied)
        if (score >= 30) return "#3498db";  // Blue (Friendly)
        if (score >= -10) return "#95a5a6"; // Grey (Neutral)
        if (score >= -50) return "#e67e22"; // Orange (Hostile)
        return "#e74c3c";                   // Red (Open War)
    }
}
