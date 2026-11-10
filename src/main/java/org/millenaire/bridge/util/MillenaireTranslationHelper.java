package org.millenaire.bridge.util;

import org.millenaire.bridge.service.MillenaireTranslationService;

/**
 * Backward-compatible static facade delegating all localization operations
 * directly to the thread-safe {@link MillenaireTranslationService}.
 *
 * All hardcoded dictionaries, static language maps, and switch statements
 * have been eliminated in favor of native Millénaire translation resolution.
 *
 * Author: Q300Z
 */
public final class MillenaireTranslationHelper {

    private static final MillenaireTranslationService SERVICE = MillenaireTranslationService.getInstance();
    private static final String DEFAULT_LOCALE = MillenaireTranslationService.DEFAULT_LOCALE;

    private MillenaireTranslationHelper() {}

    /**
     * Escapes HTML entities for safe inclusion in BlueMap HTML popups and markers.
     */
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

    public static String translateKey(String key, String fallback) {
        return SERVICE.translate(DEFAULT_LOCALE, key, fallback);
    }

    public static String translateKey(String lang, String key, String fallback) {
        return SERVICE.translate(lang, key, fallback);
    }

    public static String translateCulture(String cultureId, String fallbackDisplay) {
        return SERVICE.translateCulture(DEFAULT_LOCALE, cultureId, fallbackDisplay);
    }

    public static String translateCulture(String lang, String cultureId, String fallbackDisplay) {
        return SERVICE.translateCulture(lang, cultureId, fallbackDisplay);
    }

    public static String translateVillageType(String cultureId, String villageTypeId, String fallbackNativeName) {
        return SERVICE.translateVillageType(DEFAULT_LOCALE, cultureId, villageTypeId, fallbackNativeName);
    }

    public static String translateVillageType(String lang, String cultureId, String villageTypeId, String fallbackNativeName) {
        return SERVICE.translateVillageType(lang, cultureId, villageTypeId, fallbackNativeName);
    }

    public static String translateRole(String roleKey, String typeId, String nativeName) {
        return SERVICE.translateRole(DEFAULT_LOCALE, roleKey, typeId, nativeName);
    }

    public static String translateRole(String lang, String roleKey, String typeId, String nativeName) {
        return SERVICE.translateRole(lang, roleKey, typeId, nativeName);
    }

    public static String translateBuilding(String planSetId, String nativeName) {
        return SERVICE.translateBuilding(DEFAULT_LOCALE, planSetId, nativeName);
    }

    public static String translateBuilding(String lang, String planSetId, String nativeName) {
        return SERVICE.translateBuilding(lang, planSetId, nativeName);
    }

    public static String translateItem(String descriptionId, String itemId) {
        return SERVICE.translateItem(DEFAULT_LOCALE, descriptionId, itemId, itemId);
    }

    public static String translateItem(String lang, String descriptionId, String itemId) {
        return SERVICE.translateItem(lang, descriptionId, itemId, itemId);
    }

    public static String translateRelationStatus(int score) {
        return SERVICE.translateRelationStatus(DEFAULT_LOCALE, score);
    }

    public static String translateRelationStatus(String lang, int score) {
        return SERVICE.translateRelationStatus(lang, score);
    }

    public static String getRelationColorHex(int score) {
        if (score >= 70) return "#2ecc71";  // Green (Allied)
        if (score >= 30) return "#3498db";  // Blue (Friendly)
        if (score >= -10) return "#95a5a6"; // Grey (Neutral)
        if (score >= -50) return "#e67e22"; // Orange (Hostile)
        return "#e74c3c";                   // Red (Open War)
    }
}
