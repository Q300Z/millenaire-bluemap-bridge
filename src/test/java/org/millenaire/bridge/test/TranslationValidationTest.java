package org.millenaire.bridge.test;

import org.millenaire.bridge.service.MillenaireTranslationService;
import org.millenaire.bridge.util.MillenaireTranslationHelper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Fast, programmatic validation test suite for Millénaire BlueMap Bridge translations.
 *
 * Validates:
 * 1. Loading and merging of official Millénaire JAR translations with bridge supplementary files.
 * 2. Key resolution for cultures, village types, buildings, roles, lore, diplomacy, and items in FR and EN.
 * 3. Graceful fallback mechanics for missing keys, unknown languages, and null safety.
 * 4. Strict bit-for-bit synchronization of web assets between web/ and src/main/resources/web/.
 *
 * Author: Q300Z
 */
public final class TranslationValidationTest {

    private static int testsRun = 0;
    private static int testsPassed = 0;

    public static void main(String[] args) {
        long startTime = System.currentTimeMillis();
        System.out.println("=================================================");
        System.out.println(" Running Millénaire Bridge Translation Validation ");
        System.out.println("=================================================");

        try {
            runTest("testNativeTranslationLoading", TranslationValidationTest::testNativeTranslationLoading);
            runTest("testKeyResolutionCultures", TranslationValidationTest::testKeyResolutionCultures);
            runTest("testKeyResolutionVillageTypes", TranslationValidationTest::testKeyResolutionVillageTypes);
            runTest("testKeyResolutionBuildings", TranslationValidationTest::testKeyResolutionBuildings);
            runTest("testKeyResolutionRoles", TranslationValidationTest::testKeyResolutionRoles);
            runTest("testKeyResolutionLore", TranslationValidationTest::testKeyResolutionLore);
            runTest("testKeyResolutionDiplomacy", TranslationValidationTest::testKeyResolutionDiplomacy);
            runTest("testKeyResolutionItemsAndBlocks", TranslationValidationTest::testKeyResolutionItemsAndBlocks);
            runTest("testFallbackMechanism", TranslationValidationTest::testFallbackMechanism);
            runTest("testWebAssetSynchronization", TranslationValidationTest::testWebAssetSynchronization);

            long duration = System.currentTimeMillis() - startTime;
            System.out.println("=================================================");
            System.out.printf(" All %d validation tests passed successfully in %d ms.%n", testsPassed, duration);
            System.out.println("=================================================");
            System.exit(0);
        } catch (Throwable t) {
            System.err.println("=================================================");
            System.err.printf(" TEST FAILURE after %d tests: %s%n", testsRun, t.getMessage());
            t.printStackTrace(System.err);
            System.err.println("=================================================");
            System.exit(1);
        }
    }

    private static void runTest(String testName, RunnableWithException testRunnable) {
        testsRun++;
        try {
            testRunnable.run();
            testsPassed++;
            System.out.printf(" [PASS] %s%n", testName);
        } catch (Throwable t) {
            System.err.printf(" [FAIL] %s - %s%n", testName, t.getMessage());
            throw new RuntimeException("Assertion failure in " + testName + ": " + t.getMessage(), t);
        }
    }

    /**
     * a) Validates loading of official Millénaire JAR translations merged with bridge supplementary files
     * via MillenaireTranslationService for French (fr_fr) and English (en_us).
     */
    public static void testNativeTranslationLoading() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();
        assertNotNull(service, "MillenaireTranslationService instance must not be null");

        Map<String, String> fr = service.getMergedDictionary("fr_fr");
        assertNotNull(fr, "FR merged dictionary must not be null");
        assertTrue(fr.size() >= 5500, "FR merged dictionary must contain at least 5500 keys, found: " + fr.size());

        Map<String, String> en = service.getMergedDictionary("en_us");
        assertNotNull(en, "EN merged dictionary must not be null");
        assertTrue(en.size() >= 5500, "EN merged dictionary must contain at least 5500 keys, found: " + en.size());

        Set<String> languages = service.getAvailableLanguages();
        assertNotNull(languages, "Available languages set must not be null");
        assertTrue(languages.contains("fr_fr"), "Available languages must contain fr_fr");
        assertTrue(languages.contains("en_us"), "Available languages must contain en_us");
        assertTrue(languages.size() >= 26, "Available languages must contain at least 26 official languages, found: " + languages.size());
    }

    /**
     * b.1) Validates correct resolution of translation keys for cultures in FR and EN.
     */
    public static void testKeyResolutionCultures() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Norman
        assertEquals("Normand", service.translateCulture("fr_fr", "millenaire:norman", null), "FR culture norman");
        assertEquals("Norman", service.translateCulture("en_us", "millenaire:norman", null), "EN culture norman");
        assertEquals("Normand", service.translate("fr_fr", "culture.millenaire.norman", null), "FR culture key norman");
        assertEquals("Norman", service.translate("en_us", "culture.millenaire.norman", null), "EN culture key norman");

        // Byzantines
        assertEquals("Byzantin", service.translateCulture("fr_fr", "millenaire:byzantines", null), "FR culture byzantines");
        assertEquals("Byzantine", service.translateCulture("en_us", "millenaire:byzantines", null), "EN culture byzantines");

        // Japanese
        assertEquals("Japonais", service.translateCulture("fr_fr", "millenaire:japanese", null), "FR culture japanese");
        assertEquals("Japanese", service.translateCulture("en_us", "millenaire:japanese", null), "EN culture japanese");

        // Mayan
        assertEquals("Maya", service.translateCulture("fr_fr", "millenaire:mayan", null), "FR culture mayan");
        String enMayan = service.translateCulture("en_us", "millenaire:mayan", null);
        assertTrue("Maya".equals(enMayan) || "Mayan".equals(enMayan), "EN culture mayan expected 'Maya' or 'Mayan', got: " + enMayan);

        // Indian / Hindi
        assertEquals("Indien", service.translateCulture("fr_fr", "millenaire:indian", null), "FR culture indian");
        assertEquals("Indian", service.translateCulture("en_us", "millenaire:indian", null), "EN culture indian");
        assertEquals("Indien", service.translateCulture("fr_fr", "millenaire:hindi", null), "FR culture hindi alias");

        // Inuits
        assertEquals("Inuit", service.translateCulture("fr_fr", "millenaire:inuits", null), "FR culture inuits");
        assertEquals("Inuit", service.translateCulture("en_us", "millenaire:inuits", null), "EN culture inuits");

        // Seljuk
        assertEquals("Seldjoukide", service.translateCulture("fr_fr", "millenaire:seljuk", null), "FR culture seljuk");
        assertEquals("Seljuk", service.translateCulture("en_us", "millenaire:seljuk", null), "EN culture seljuk");

        // Static facade check
        assertEquals("Normand", MillenaireTranslationHelper.translateCulture("fr_fr", "millenaire:norman", null), "Facade FR norman");
        assertEquals("Norman", MillenaireTranslationHelper.translateCulture("en_us", "millenaire:norman", null), "Facade EN norman");
    }

    /**
     * b.2) Validates correct resolution of translation keys for village types in FR and EN.
     */
    public static void testKeyResolutionVillageTypes() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Norman agricultural village
        assertEquals("Village agricole", service.translateVillageType("fr_fr", "norman", "agricole", null), "FR village agricole");
        assertEquals("Agricultural Village", service.translateVillageType("en_us", "norman", "agricole", null), "EN village agricole");
        assertEquals("Village agricole", service.translate("fr_fr", "villagetype.millenaire.norman.agricole", null), "FR key village agricole");
        assertEquals("Agricultural Village", service.translate("en_us", "villagetype.millenaire.norman.agricole", null), "EN key village agricole");

        // Norman ecclesiastical village
        assertEquals("Village ecclésiastique", service.translateVillageType("fr_fr", "norman", "ecclesiastique", null), "FR village ecclesiastique");
        assertEquals("Ecclesiastical Village", service.translateVillageType("en_us", "norman", "ecclesiastique", null), "EN village ecclesiastique");

        // Byzantines military village
        assertEquals("Village militaire", service.translateVillageType("fr_fr", "byzantines", "militaryvillage", null), "FR byz military village");
        assertEquals("Military Village", service.translateVillageType("en_us", "byzantines", "militaryvillage", null), "EN byz military village");

        // Byzantines religious village
        assertEquals("Village religieux", service.translateVillageType("fr_fr", "byzantines", "religiousvillage", null), "FR byz religious village");
        assertEquals("Religious Village", service.translateVillageType("en_us", "byzantines", "religiousvillage", null), "EN byz religious village");

        // Static facade check
        assertEquals("Village agricole", MillenaireTranslationHelper.translateVillageType("fr_fr", "norman", "agricole", null), "Facade FR village agricole");
        assertEquals("Agricultural Village", MillenaireTranslationHelper.translateVillageType("en_us", "norman", "agricole", null), "Facade EN village agricole");
    }

    /**
     * b.3) Validates correct resolution of translation keys for buildings in FR and EN.
     */
    public static void testKeyResolutionBuildings() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Norman church ("Chapelle" in official Millénaire French, "Church" in English)
        String frChurch = service.translateBuilding("fr_fr", "millenaire:norman/church", "Eglise");
        assertTrue("Chapelle".equals(frChurch) || "Eglise".equals(frChurch), "FR building church expected 'Chapelle' or 'Eglise', got: " + frChurch);
        assertEquals("Church", service.translateBuilding("en_us", "millenaire:norman/church", "Church"), "EN building church");

        // Norman abbey
        assertEquals("Abbaye", service.translateBuilding("fr_fr", "millenaire:norman/abbey", null), "FR building abbey");
        assertEquals("Abbey", service.translateBuilding("en_us", "millenaire:norman/abbey", null), "EN building abbey");

        // Norman forge
        assertEquals("Forge", service.translateBuilding("fr_fr", "millenaire:norman/forge", null), "FR building forge");
        assertEquals("Forge", service.translateBuilding("en_us", "millenaire:norman/forge", null), "EN building forge");

        // Norman bakery
        assertEquals("Boulangerie", service.translateBuilding("fr_fr", "millenaire:norman/bakery", null), "FR building bakery");
        assertEquals("Bakery", service.translateBuilding("en_us", "millenaire:norman/bakery", null), "EN building bakery");

        // Static facade check
        assertEquals("Abbaye", MillenaireTranslationHelper.translateBuilding("fr_fr", "millenaire:norman/abbey", null), "Facade FR abbey");
        assertEquals("Abbey", MillenaireTranslationHelper.translateBuilding("en_us", "millenaire:norman/abbey", null), "Facade EN abbey");
    }

    /**
     * b.4) Validates correct resolution of translation keys for roles in FR and EN.
     */
    public static void testKeyResolutionRoles() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Norman farmer
        assertEquals("Fermier", service.translateRole("fr_fr", "role.millenaire.norman_farmer", null, null), "FR role farmer");
        assertEquals("Farmer", service.translateRole("en_us", "role.millenaire.norman_farmer", null, null), "EN role farmer");
        assertEquals("Fermier", service.translateRole("fr_fr", null, "millenaire:norman/farmer", null), "FR role typeId farmer");
        assertEquals("Farmer", service.translateRole("en_us", null, "millenaire:norman/farmer", null), "EN role typeId farmer");

        // Norman guard
        assertEquals("Garde", service.translateRole("fr_fr", "role.millenaire.norman_guard", null, null), "FR role guard");
        assertEquals("Guard", service.translateRole("en_us", "role.millenaire.norman_guard", null, null), "EN role guard");

        // Norman monk
        assertEquals("Moine", service.translateRole("fr_fr", "role.millenaire.norman_monk", null, null), "FR role monk");
        assertEquals("Monk", service.translateRole("en_us", "role.millenaire.norman_monk", null, null), "EN role monk");

        // Static facade check
        assertEquals("Fermier", MillenaireTranslationHelper.translateRole("fr_fr", "role.millenaire.norman_farmer", null, null), "Facade FR farmer");
        assertEquals("Farmer", MillenaireTranslationHelper.translateRole("en_us", "role.millenaire.norman_farmer", null, null), "Facade EN farmer");
    }

    /**
     * b.5) Validates correct resolution of translation keys for travelbook lore in FR and EN.
     */
    public static void testKeyResolutionLore() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Supplementary village lore
        String frAgricoleLore = service.translateLore("fr_fr", "travelbook.millenaire.norman.village.agricole.desc", null);
        assertNotNull(frAgricoleLore, "FR agricole lore must not be null");
        assertTrue(frAgricoleLore.length() > 20, "FR agricole lore must be non-empty");
        assertTrue(frAgricoleLore.contains("nourriture"), "FR agricole lore content");

        String enAgricoleLore = service.translateLore("en_us", "travelbook.millenaire.norman.village.agricole.desc", null);
        assertNotNull(enAgricoleLore, "EN agricole lore must not be null");
        assertTrue(enAgricoleLore.length() > 20, "EN agricole lore must be non-empty");
        assertTrue(enAgricoleLore.contains("food"), "EN agricole lore content");

        // Official JAR culture lore
        String frCultureLore = service.translateLore("fr_fr", "travelbook.millenaire.norman.culture.desc", null);
        assertNotNull(frCultureLore, "FR norman culture lore must not be null");
        assertTrue(frCultureLore.length() > 20, "FR norman culture lore must be non-empty");
        assertTrue(frCultureLore.contains("normands") || frCultureLore.contains("Normands"), "FR culture lore content");

        String enCultureLore = service.translateLore("en_us", "travelbook.millenaire.norman.culture.desc", null);
        assertNotNull(enCultureLore, "EN norman culture lore must not be null");
        assertTrue(enCultureLore.length() > 20, "EN norman culture lore must be non-empty");
        assertTrue(enCultureLore.contains("Normans") || enCultureLore.contains("normans"), "EN culture lore content");
    }

    /**
     * b.6) Validates correct resolution of translation keys for diplomatic relations in FR and EN.
     */
    public static void testKeyResolutionDiplomacy() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Direct keys
        assertEquals("Très bon", service.translate("fr_fr", "relation.millenaire.verygood", null), "FR relation verygood");
        assertEquals("Very Good", service.translate("en_us", "relation.millenaire.verygood", null), "EN relation verygood");
        assertEquals("Excellent", service.translate("fr_fr", "relation.millenaire.excellent", null), "FR relation excellent");
        assertEquals("Excellent", service.translate("en_us", "relation.millenaire.excellent", null), "EN relation excellent");
        assertEquals("Neutre", service.translate("fr_fr", "relation.millenaire.neutral", null), "FR relation neutral");
        assertEquals("Neutral", service.translate("en_us", "relation.millenaire.neutral", null), "EN relation neutral");

        // Score based resolution
        assertEquals("Très bon", service.translateRelationStatus("fr_fr", 75), "FR score 75 status");
        assertEquals("Very Good", service.translateRelationStatus("en_us", 75), "EN score 75 status");
        assertEquals("Excellent", service.translateRelationStatus("fr_fr", 95), "FR score 95 status");
        assertEquals("Excellent", service.translateRelationStatus("en_us", 95), "EN score 95 status");
        assertEquals("Neutre", service.translateRelationStatus("fr_fr", 0), "FR score 0 status");
        assertEquals("Neutral", service.translateRelationStatus("en_us", 0), "EN score 0 status");

        // Static facade check
        assertEquals("Très bon", MillenaireTranslationHelper.translateRelationStatus("fr_fr", 75), "Facade FR score 75");
        assertEquals("Very Good", MillenaireTranslationHelper.translateRelationStatus("en_us", 75), "Facade EN score 75");
    }

    /**
     * b.7) Validates correct resolution of translation keys for items and blocks in FR and EN.
     */
    public static void testKeyResolutionItemsAndBlocks() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Millenaire item: cider
        assertEquals("Cidre", service.translate("fr_fr", "item.millenaire.cider", null), "FR item cider key");
        assertEquals("Cider", service.translate("en_us", "item.millenaire.cider", null), "EN item cider key");
        assertEquals("Cidre", service.translateItem("fr_fr", "millenaire:cider", null), "FR item cider id");
        assertEquals("Cider", service.translateItem("en_us", "millenaire:cider", null), "EN item cider id");

        // Minecraft item: iron_ingot
        assertEquals("Lingot de fer", service.translate("fr_fr", "item.minecraft.iron_ingot", null), "FR item iron_ingot key");
        assertEquals("Iron Ingot", service.translate("en_us", "item.minecraft.iron_ingot", null), "EN item iron_ingot key");
        assertEquals("Lingot de fer", service.translateItem("fr_fr", "minecraft:iron_ingot", null), "FR item iron_ingot id");
        assertEquals("Iron Ingot", service.translateItem("en_us", "minecraft:iron_ingot", null), "EN item iron_ingot id");

        // Minecraft item: iron_bars
        assertEquals("Barreaux de fer", service.translateItem("fr_fr", "minecraft:iron_bars", null), "FR item iron_bars");
        assertEquals("Iron Bars", service.translateItem("en_us", "minecraft:iron_bars", null), "EN item iron_bars");

        // Minecraft block: iron_block
        assertEquals("Bloc de fer", service.translateItem("fr_fr", "minecraft:iron_block", null), "FR block iron_block");
        assertEquals("Block of Iron", service.translateItem("en_us", "minecraft:iron_block", null), "EN block iron_block");

        // Minecraft block: stone
        assertEquals("Roche", service.translateItem("fr_fr", "minecraft:stone", null), "FR block stone");
        assertEquals("Stone", service.translateItem("en_us", "minecraft:stone", null), "EN block stone");

        // Fallback for item without explicit dictionary entry (e.g. iron_sword)
        assertEquals("Épée en fer", service.translateItem("fr_fr", "minecraft:iron_sword", "Épée en fer"), "FR item iron_sword fallback");
        assertEquals("Iron Sword", service.translateItem("en_us", "minecraft:iron_sword", "Iron Sword"), "EN item iron_sword fallback");

        // Static facade check
        assertEquals("Cidre", MillenaireTranslationHelper.translateItem("fr_fr", null, "millenaire:cider"), "Facade FR cider");
        assertEquals("Cider", MillenaireTranslationHelper.translateItem("en_us", null, "millenaire:cider"), "Facade EN cider");
    }

    /**
     * c) Validates the fallback mechanism: unknown keys, missing languages, and null safety.
     */
    public static void testFallbackMechanism() {
        MillenaireTranslationService service = MillenaireTranslationService.getInstance();

        // Unknown key with custom fallback string
        String unknownWithFallback = service.translate("fr_fr", "non.existent.bridge.key.12345", "MonRepliPersonnalisé");
        assertEquals("MonRepliPersonnalisé", unknownWithFallback, "Fallback string must be returned for unknown key");

        // Unknown key without fallback returns the key itself
        String unknownWithoutFallback = service.translate("fr_fr", "non.existent.bridge.key.12345", null);
        assertEquals("non.existent.bridge.key.12345", unknownWithoutFallback, "Key itself must be returned when fallback is null");

        // Unsupported / non-existent locale falls back through en_us or fr_fr
        String fallbackLocale = service.translate("zz_zz", "culture.millenaire.norman", "Défaut");
        assertTrue("Norman".equals(fallbackLocale) || "Normand".equals(fallbackLocale),
            "Non-existent locale must fall back to EN or FR, got: " + fallbackLocale);

        // Null and empty safety checks (no exceptions thrown)
        assertEquals("SafeFallback", service.translate("fr_fr", null, "SafeFallback"), "Null key returns fallback");
        assertEquals("SafeFallback", service.translate("fr_fr", "", "SafeFallback"), "Empty key returns fallback");
        assertEquals("DefaultCulture", service.translateCulture("fr_fr", null, "DefaultCulture"), "Null culture returns fallback");
        assertEquals("DefaultBuilding", service.translateBuilding("fr_fr", null, "DefaultBuilding"), "Null building returns fallback");
        assertEquals("DefaultItem", service.translateItem("fr_fr", null, "DefaultItem"), "Null item returns fallback");

        String safeRole = service.translateRole("fr_fr", null, null, null);
        assertNotNull(safeRole, "Null role resolution must return non-null default");
        assertTrue(!safeRole.isBlank(), "Null role resolution must return non-empty default");
    }

    /**
     * d) Validates that web assets (JS and CSS) are bit-for-bit identical between web/ and src/main/resources/web/.
     */
    public static void testWebAssetSynchronization() throws IOException {
        Path projectRoot = locateProjectRoot();
        assertNotNull(projectRoot, "Could not determine project root directory");

        // 1. Validate millenaire_panel.js
        Path webJs = projectRoot.resolve("web/js/millenaire_panel.js");
        Path resJs = projectRoot.resolve("src/main/resources/web/js/millenaire_panel.js");

        assertTrue(Files.exists(webJs), "web/js/millenaire_panel.js must exist at: " + webJs);
        assertTrue(Files.exists(resJs), "src/main/resources/web/js/millenaire_panel.js must exist at: " + resJs);

        byte[] webJsBytes = Files.readAllBytes(webJs);
        byte[] resJsBytes = Files.readAllBytes(resJs);

        assertTrue(webJsBytes.length > 0, "web/js/millenaire_panel.js must not be empty");
        assertTrue(resJsBytes.length > 0, "src/main/resources/web/js/millenaire_panel.js must not be empty");
        assertTrue(Arrays.equals(webJsBytes, resJsBytes),
            "web/js/millenaire_panel.js (" + webJsBytes.length + " bytes) and src/main/resources/web/js/millenaire_panel.js (" +
            resJsBytes.length + " bytes) must be bit-for-bit identical");

        // 2. Validate millenaire_panel.css
        Path webCss = projectRoot.resolve("web/css/millenaire_panel.css");
        Path resCss = projectRoot.resolve("src/main/resources/web/css/millenaire_panel.css");

        assertTrue(Files.exists(webCss), "web/css/millenaire_panel.css must exist at: " + webCss);
        assertTrue(Files.exists(resCss), "src/main/resources/web/css/millenaire_panel.css must exist at: " + resCss);

        byte[] webCssBytes = Files.readAllBytes(webCss);
        byte[] resCssBytes = Files.readAllBytes(resCss);

        assertTrue(webCssBytes.length > 0, "web/css/millenaire_panel.css must not be empty");
        assertTrue(resCssBytes.length > 0, "src/main/resources/web/css/millenaire_panel.css must not be empty");
        assertTrue(Arrays.equals(webCssBytes, resCssBytes),
            "web/css/millenaire_panel.css (" + webCssBytes.length + " bytes) and src/main/resources/web/css/millenaire_panel.css (" +
            resCssBytes.length + " bytes) must be bit-for-bit identical");
    }

    private static Path locateProjectRoot() {
        Path current = Path.of(".").toAbsolutePath().normalize();
        if (Files.exists(current.resolve("src/main/resources/web/js/millenaire_panel.js"))) {
            return current;
        }
        if (Files.exists(current.resolve("millenaire-bluemap-bridge/src/main/resources/web/js/millenaire_panel.js"))) {
            return current.resolve("millenaire-bluemap-bridge");
        }
        Path parent = current.getParent();
        if (parent != null && Files.exists(parent.resolve("millenaire-bluemap-bridge/src/main/resources/web/js/millenaire_panel.js"))) {
            return parent.resolve("millenaire-bluemap-bridge");
        }
        return current;
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertNotNull(Object obj, String message) {
        if (obj == null) {
            throw new AssertionError(message);
        }
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (!Objects.equals(expected, actual)) {
            throw new AssertionError(message + " - Expected: <" + expected + "> but was: <" + actual + ">");
        }
    }

    @FunctionalInterface
    private interface RunnableWithException {
        void run() throws Throwable;
    }
}
