package org.millenaire.bridge.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe translation service for the Millénaire BlueMap Bridge.
 *
 * Automatically loads official Millénaire language files directly from the Millénaire JAR
 * (/assets/millenaire/lang/<lang>.json) via ClassLoader, and merges them with bridge-provided
 * supplementary dictionaries (/assets/millenaire_bluemap/lang/<lang>.json).
 *
 * Implements a robust fallback chain:
 * Requested language -> en_us -> fr_fr -> provided fallback / native name.
 *
 * Author: Q300Z
 */
public final class MillenaireTranslationService {

    private static final Logger LOGGER = LogManager.getLogger();
    private static final Gson GSON = new Gson();
    private static final Type DICT_TYPE = new TypeToken<Map<String, String>>() {}.getType();

    public static final String DEFAULT_LOCALE = "fr_fr";
    public static final String FALLBACK_LOCALE_EN = "en_us";
    public static final String FALLBACK_LOCALE_FR = "fr_fr";

    public static final Set<String> OFFICIAL_LANGUAGES = Set.of(
        "ar_sa", "cs_cz", "da_dk", "de_de", "en_us", "es_es", "et_ee", "fr_fr",
        "hi_in", "hu_hu", "it_it", "ja_jp", "ko_kr", "nb_no", "nl_nl", "pl_pl",
        "pt_br", "pt_pt", "ru_ru", "sl_si", "sv_se", "th_th", "tr_tr", "uk_ua",
        "zh_cn", "zh_tw"
    );

    private static final MillenaireTranslationService INSTANCE = new MillenaireTranslationService();

    private final ConcurrentHashMap<String, Map<String, String>> langCache = new ConcurrentHashMap<>();

    private MillenaireTranslationService() {
        // Pre-warm primary languages
        getMergedDictionary(DEFAULT_LOCALE);
        getMergedDictionary(FALLBACK_LOCALE_EN);
    }

    public static MillenaireTranslationService getInstance() {
        return INSTANCE;
    }

    /**
     * Normalizes a locale code (e.g. "fr", "FR-fr", "en-US") to Millénaire canonical format ("fr_fr", "en_us").
     */
    public static String normalizeLocale(String rawLocale) {
        if (rawLocale == null || rawLocale.isBlank()) {
            return DEFAULT_LOCALE;
        }
        String normalized = rawLocale.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        return switch (normalized) {
            case "fr" -> "fr_fr";
            case "en" -> "en_us";
            case "de" -> "de_de";
            case "es" -> "es_es";
            case "it" -> "it_it";
            case "ja" -> "ja_jp";
            case "ru" -> "ru_ru";
            case "zh" -> "zh_cn";
            case "pt" -> "pt_br";
            default -> normalized;
        };
    }

    /**
     * Retrieves the immutable merged dictionary for a specific locale.
     * Loads and caches on demand if not already present.
     */
    public Map<String, String> getMergedDictionary(String lang) {
        String normalized = normalizeLocale(lang);
        return langCache.computeIfAbsent(normalized, this::loadAndMergeDictionary);
    }

    /**
     * Loads the official Millénaire language file and the bridge overlay file,
     * merging them into an immutable map.
     */
    private Map<String, String> loadAndMergeDictionary(String locale) {
        Map<String, String> merged = new HashMap<>();

        // 1. Load official Millénaire translation file from JAR
        Map<String, String> officialMap = loadJsonResource("/assets/millenaire/lang/" + locale + ".json");
        if (officialMap != null && !officialMap.isEmpty()) {
            merged.putAll(officialMap);
            LOGGER.debug("Loaded {} official Millénaire translation keys for [{}]", officialMap.size(), locale);
        } else {
            LOGGER.debug("No official Millénaire lang file found for [{}], using overlays/fallbacks", locale);
        }

        // 2. Load bridge supplementary translation overlay
        Map<String, String> bridgeMap = loadJsonResource("/assets/millenaire_bluemap/lang/" + locale + ".json");
        if (bridgeMap != null && !bridgeMap.isEmpty()) {
            merged.putAll(bridgeMap);
            LOGGER.debug("Loaded {} bridge supplementary translation keys for [{}]", bridgeMap.size(), locale);
        }

        if (merged.isEmpty()) {
            LOGGER.warn("Dictionary for [{}] is empty. Check classpath resources.", locale);
        }

        return Collections.unmodifiableMap(merged);
    }

    private Map<String, String> loadJsonResource(String resourcePath) {
        try {
            InputStream is = getClass().getResourceAsStream(resourcePath);
            if (is == null) {
                is = org.millenaire.village.Village.class.getResourceAsStream(resourcePath);
            }
            if (is == null && Thread.currentThread().getContextClassLoader() != null) {
                is = Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath.startsWith("/") ? resourcePath.substring(1) : resourcePath);
            }
            if (is == null) {
                return Collections.emptyMap();
            }
            try (InputStream stream = is;
                 InputStreamReader reader = new InputStreamReader(stream, StandardCharsets.UTF_8)) {
                Map<String, String> map = GSON.fromJson(reader, DICT_TYPE);
                return map != null ? map : Collections.emptyMap();
            }
        } catch (Exception e) {
            LOGGER.warn("Failed to load translation resource: {}", resourcePath, e);
            return Collections.emptyMap();
        }
    }

    /**
     * Translates a key with the canonical fallback chain:
     * Requested Language -> en_us -> fr_fr -> provided fallback -> key.
     */
    public String translate(String lang, String key, String fallback) {
        if (key == null || key.isBlank()) {
            return fallback != null ? fallback : "";
        }

        String normLang = normalizeLocale(lang);
        Map<String, String> requestedDict = getMergedDictionary(normLang);
        String val = requestedDict.get(key);
        if (val != null && !val.isBlank()) {
            return val;
        }

        // Fallback 1: English (en_us)
        if (!FALLBACK_LOCALE_EN.equals(normLang)) {
            Map<String, String> enDict = getMergedDictionary(FALLBACK_LOCALE_EN);
            val = enDict.get(key);
            if (val != null && !val.isBlank()) {
                return val;
            }
        }

        // Fallback 2: French (fr_fr)
        if (!FALLBACK_LOCALE_FR.equals(normLang)) {
            Map<String, String> frDict = getMergedDictionary(FALLBACK_LOCALE_FR);
            val = frDict.get(key);
            if (val != null && !val.isBlank()) {
                return val;
            }
        }

        return (fallback != null && !fallback.isBlank()) ? fallback : key;
    }

    /**
     * Translates a culture identifier.
     * e.g. "millenaire:norman" -> key "culture.millenaire.norman"
     */
    public String translateCulture(String lang, String cultureId, String fallback) {
        if (cultureId == null || cultureId.isBlank()) {
            return fallback != null ? fallback : "Culture";
        }
        String cleanId = cultureId.contains(":") ? cultureId.substring(cultureId.indexOf(':') + 1) : cultureId;
        if ("hindi".equals(cleanId)) {
            cleanId = "indian";
        }
        String key = "culture.millenaire." + cleanId;
        return translate(lang, key, fallback != null ? fallback : cleanId);
    }

    /**
     * Translates a village type.
     * e.g. cultureId="millenaire:norman", villageTypeId="agricole" -> key "villagetype.millenaire.norman.agricole"
     */
    public String translateVillageType(String lang, String cultureId, String villageTypeId, String fallbackNativeName) {
        String cleanCulture = cultureId != null && cultureId.contains(":")
            ? cultureId.substring(cultureId.indexOf(':') + 1)
            : (cultureId != null ? cultureId : "");
        if ("hindi".equals(cleanCulture)) {
            cleanCulture = "indian";
        }

        String cleanType = villageTypeId != null ? villageTypeId : "";
        if (cleanType.contains("/")) {
            String[] parts = cleanType.split("/", 2);
            if (cleanCulture.isEmpty()) {
                cleanCulture = parts[0].contains(":") ? parts[0].substring(parts[0].indexOf(':') + 1) : parts[0];
            }
            cleanType = parts[1];
        } else if (cleanType.contains(":")) {
            cleanType = cleanType.substring(cleanType.indexOf(':') + 1);
        }

        String key = "villagetype.millenaire." + cleanCulture + "." + cleanType;
        String fallback = (fallbackNativeName != null && !fallbackNativeName.isBlank())
            ? fallbackNativeName
            : cleanType;
        return translate(lang, key, fallback);
    }

    /**
     * Translates a building plan set.
     * e.g. planSetId="millenaire:norman/church" -> key "building.millenaire.norman.church"
     */
    public String translateBuilding(String lang, String planSetId, String fallbackNativeName) {
        if (planSetId == null || planSetId.isBlank()) {
            return fallbackNativeName != null ? fallbackNativeName : "Bâtiment";
        }
        String key;
        if (planSetId.startsWith("building.")) {
            key = planSetId;
        } else {
            key = "building." + planSetId.replace(':', '.').replace('/', '.');
        }

        String defaultFallback = (fallbackNativeName != null && !fallbackNativeName.isBlank())
            ? fallbackNativeName
            : (planSetId.contains("/") ? planSetId.substring(planSetId.lastIndexOf('/') + 1) : planSetId);

        return translate(lang, key, defaultFallback);
    }

    /**
     * Translates a villager role.
     * e.g. roleKey="role.millenaire.norman_farmer" or typeId="millenaire:norman/farmer"
     */
    public String translateRole(String lang, String roleKey, String villagerTypeId, String fallbackNativeName) {
        if (roleKey != null && !roleKey.isBlank() && roleKey.startsWith("role.")) {
            String tr = translate(lang, roleKey, null);
            if (!tr.equals(roleKey)) {
                return tr;
            }
        }

        if (villagerTypeId != null && !villagerTypeId.isBlank()) {
            String normalizedKey = "role." + villagerTypeId.replace(':', '.').replace('/', '_');
            String tr = translate(lang, normalizedKey, null);
            if (!tr.equals(normalizedKey)) {
                return tr;
            }
        }

        if (fallbackNativeName != null && !fallbackNativeName.isBlank()) {
            return fallbackNativeName;
        }

        if (roleKey != null && !roleKey.isBlank() && !roleKey.startsWith("role.")) {
            return roleKey;
        }

        if (villagerTypeId != null && villagerTypeId.contains("/")) {
            return villagerTypeId.substring(villagerTypeId.lastIndexOf('/') + 1);
        }

        return translate(lang, "millenaire.bridge.ui.villager", "Villageois");
    }

    /**
     * Translates an item ID (Minecraft vanilla or Millénaire).
     */
    public String translateItem(String lang, String itemId, String fallback) {
        if (itemId == null || itemId.isBlank()) {
            return fallback != null ? fallback : "Objet";
        }

        // Direct key check
        if (itemId.startsWith("item.") || itemId.startsWith("block.")) {
            return translate(lang, itemId, fallback != null ? fallback : itemId);
        }

        if (itemId.contains(":")) {
            String[] parts = itemId.split(":", 2);
            String itemKey = "item." + parts[0] + "." + parts[1];
            String blockKey = "block." + parts[0] + "." + parts[1];

            String tr = translate(lang, itemKey, null);
            if (!tr.equals(itemKey)) return tr;

            tr = translate(lang, blockKey, null);
            if (!tr.equals(blockKey)) return tr;

            // Try fallback namespace minecraft
            if (!"minecraft".equals(parts[0])) {
                String mcItemKey = "item.minecraft." + parts[1];
                tr = translate(lang, mcItemKey, null);
                if (!tr.equals(mcItemKey)) return tr;
            }

            return fallback != null ? fallback : parts[1].replace('_', ' ');
        }

        // No namespace provided: try item.minecraft.<id> and block.minecraft.<id>
        String itemKey = "item.minecraft." + itemId;
        String blockKey = "block.minecraft." + itemId;
        String tr = translate(lang, itemKey, null);
        if (!tr.equals(itemKey)) return tr;

        tr = translate(lang, blockKey, null);
        if (!tr.equals(blockKey)) return tr;

        // Try millenaire item
        String milItemKey = "item.millenaire." + itemId;
        tr = translate(lang, milItemKey, null);
        if (!tr.equals(milItemKey)) return tr;

        return fallback != null ? fallback : itemId.replace('_', ' ');
    }

    /**
     * Translates an item with an optional descriptionId (e.g. from ItemStack.getDescriptionId()).
     */
    public String translateItem(String lang, String descriptionId, String itemId, String fallback) {
        if (descriptionId != null && !descriptionId.isBlank()) {
            String tr = translate(lang, descriptionId, null);
            if (!tr.equals(descriptionId)) {
                return tr;
            }
        }
        return translateItem(lang, itemId, fallback);
    }

    /**
     * Translates diplomatic relation status by score.
     */
    public String translateRelationStatus(String lang, int score) {
        String key;
        String fallback;
        if (score >= 90) {
            key = "relation.millenaire.excellent";
            fallback = "Allié (Excellent)";
        } else if (score >= 70) {
            key = "relation.millenaire.verygood";
            fallback = "Allié (Très bon)";
        } else if (score >= 50) {
            key = "relation.millenaire.good";
            fallback = "Amical (Bon)";
        } else if (score >= 30) {
            key = "relation.millenaire.decent";
            fallback = "Cordial (Convenable)";
        } else if (score >= 10) {
            key = "relation.millenaire.fair";
            fallback = "Correct";
        } else if (score <= -90) {
            key = "relation.millenaire.openconflict";
            fallback = "Conflit ouvert";
        } else if (score <= -70) {
            key = "relation.millenaire.atrocious";
            fallback = "Atroce";
        } else if (score <= -50) {
            key = "relation.millenaire.verybad";
            fallback = "Hostile (Très mauvais)";
        } else if (score <= -30) {
            key = "relation.millenaire.bad";
            fallback = "Tendu (Mauvais)";
        } else if (score <= -10) {
            key = "relation.millenaire.chilly";
            fallback = "Frais";
        } else {
            key = "relation.millenaire.neutral";
            fallback = "Neutre";
        }

        return translate(lang, key, fallback);
    }

    /**
     * Translates lore description keys.
     */
    public String translateLore(String lang, String loreKey, String fallback) {
        return translate(lang, loreKey, fallback);
    }

    /**
     * Returns the set of all available language codes.
     */
    public Set<String> getAvailableLanguages() {
        Set<String> languages = new TreeSet<>(OFFICIAL_LANGUAGES);
        languages.addAll(langCache.keySet());
        return Collections.unmodifiableSet(languages);
    }
}
