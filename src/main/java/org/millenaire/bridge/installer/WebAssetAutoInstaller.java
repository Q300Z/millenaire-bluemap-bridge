package org.millenaire.bridge.installer;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Automates the extraction and synchronization of BlueMap web assets (JS/CSS)
 * and Millénaire merged translation dictionaries into BlueMap's webroot,
 * and automatically configures config/bluemap/webapp.conf.
 *
 * Verifies the integrity of installed assets using SHA-256 checksums.
 * If files are missing, corrupted, or outdated, they are automatically restored
 * or upgraded to the exact version bundled in the mod JAR.
 *
 * Runs automatically when Minecraft starts, and can also be run standalone.
 *
 * Author: Q300Z
 */
public final class WebAssetAutoInstaller {

    private static final String PREFIX = "[MillenaireBridge-Installer] ";

    private static final String JS_RESOURCE = "/web/js/millenaire_panel.js";
    private static final String CSS_RESOURCE = "/web/css/millenaire_panel.css";

    private static final String JS_TARGET_NAME = "js/millenaire_panel.js";
    private static final String CSS_TARGET_NAME = "css/millenaire_panel.css";

    private static final String[] EXPORT_LOCALES = new String[] { "fr_fr", "en_us" };

    private WebAssetAutoInstaller() {}

    public static void main(String[] args) {
        System.out.println(PREFIX + "Starting standalone installation & checksum verification...");
        install();
        System.out.println(PREFIX + "Installation & verification completed.");
    }

    private static void logInfo(String message) {
        System.out.println(PREFIX + message);
    }

    private static void logWarn(String message) {
        System.err.println(PREFIX + "WARN: " + message);
    }

    private static void logError(String message, Throwable t) {
        System.err.println(PREFIX + "ERROR: " + message);
        if (t != null) {
            t.printStackTrace(System.err);
        }
    }

    public static void install() {
        try {
            logInfo("Checking automatic installation & SHA-256 checksums of Millénaire BlueMap web assets...");

            Path configDir = Paths.get("config", "bluemap");
            Path webappConfPath = configDir.resolve("webapp.conf");

            // 1. Determine webroot from webapp.conf or default to "bluemap/web"
            String webrootStr = "bluemap/web";
            if (Files.exists(webappConfPath)) {
                try {
                    String confContent = Files.readString(webappConfPath, StandardCharsets.UTF_8);
                    Matcher webrootMatcher = Pattern.compile("(?m)^\\s*webroot\\s*:\\s*[\"']([^\"']+)[\"']").matcher(confContent);
                    if (webrootMatcher.find()) {
                        webrootStr = webrootMatcher.group(1).trim();
                    }
                } catch (Exception e) {
                    logWarn("Could not read webroot from webapp.conf, using default 'bluemap/web': " + e.getMessage());
                }
            }

            Path webrootDir = Paths.get(webrootStr);

            // 2. Extract and verify embedded JS & CSS files into webroot via SHA-256 checksums
            boolean jsUpdated = verifyAndSyncResource(JS_RESOURCE, webrootDir.resolve(JS_TARGET_NAME));
            boolean cssUpdated = verifyAndSyncResource(CSS_RESOURCE, webrootDir.resolve(CSS_TARGET_NAME));

            if (jsUpdated || cssUpdated) {
                logInfo("Millénaire BlueMap web assets successfully updated and verified in '" + webrootDir + "'");
            } else {
                logInfo("All Millénaire BlueMap web assets in '" + webrootDir + "' match expected SHA-256 checksums.");
            }

            // 3. Export merged language files into webroot (data/lang/)
            exportLanguageFiles(webrootDir);

            // 4. Automatically patch webapp.conf to include JS and CSS if needed
            patchWebappConf(webappConfPath);

        } catch (Exception e) {
            logError("Failed to execute automatic web asset installation: " + e.getMessage(), e);
        }
    }

    /**
     * Exports full merged translation dictionaries (fr_fr, en_us, fr, en) and manifest.json
     * into <webroot>/data/lang/ for the frontend client-side i18n engine.
     */
    public static void exportLanguageFiles(Path webrootDir) {
        try {
            Path langDir = webrootDir.resolve("data").resolve("lang");
            if (!Files.exists(langDir)) {
                Files.createDirectories(langDir);
            }

            for (String locale : EXPORT_LOCALES) {
                byte[] jsonBytes = resolveMergedLocaleJson(locale);
                if (jsonBytes != null && jsonBytes.length > 0) {
                    // Export canonical (e.g. fr_fr.json)
                    Path canonicalPath = langDir.resolve(locale + ".json");
                    writeIfChanged(canonicalPath, jsonBytes);

                    // Export short alias (e.g. fr.json for fr_fr, en.json for en_us)
                    String shortAlias = locale.split("_")[0];
                    Path aliasPath = langDir.resolve(shortAlias + ".json");
                    writeIfChanged(aliasPath, jsonBytes);
                }
            }

            // Export manifest.json
            String manifestJson = """
                {
                  "default": "fr_fr",
                  "languages": {
                    "fr_fr": {
                      "code": "fr_fr",
                      "name": "Français",
                      "file": "fr_fr.json"
                    },
                    "en_us": {
                      "code": "en_us",
                      "name": "English",
                      "file": "en_us.json"
                    }
                  }
                }
                """;
            Path manifestPath = langDir.resolve("manifest.json");
            writeIfChanged(manifestPath, manifestJson.getBytes(StandardCharsets.UTF_8));

        } catch (Exception e) {
            logError("Failed to export language files to " + webrootDir + ": " + e.getMessage(), e);
        }
    }

    private static byte[] resolveMergedLocaleJson(String locale) {
        try {
            // Attempt to load from MillenaireTranslationService (fully merged official + bridge dictionaries)
            org.millenaire.bridge.service.MillenaireTranslationService service =
                org.millenaire.bridge.service.MillenaireTranslationService.getInstance();
            Map<String, String> merged = service.getMergedDictionary(locale);
            if (merged != null && !merged.isEmpty()) {
                com.google.gson.Gson gson = new com.google.gson.GsonBuilder().disableHtmlEscaping().create();
                String json = gson.toJson(merged);
                return json.getBytes(StandardCharsets.UTF_8);
            }
        } catch (Throwable t) {
            logWarn("Could not dynamically resolve merged dictionary via MillenaireTranslationService: " + t.getMessage());
        }

        // Fallback: load directly from bundled bridge resource
        String resPath = "/assets/millenaire_bluemap/lang/" + locale + ".json";
        try (InputStream in = WebAssetAutoInstaller.class.getResourceAsStream(resPath)) {
            if (in != null) {
                return in.readAllBytes();
            }
        } catch (Exception e) {
            logWarn("Failed to read bundled bridge lang resource " + resPath + ": " + e.getMessage());
        }
        return null;
    }

    private static void writeIfChanged(Path path, byte[] content) {
        try {
            String newChecksum = computeSha256(content);
            if (Files.exists(path)) {
                byte[] existing = Files.readAllBytes(path);
                String existingChecksum = computeSha256(existing);
                if (newChecksum.equalsIgnoreCase(existingChecksum)) {
                    return; // Up-to-date
                }
            }
            Path parent = path.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }
            Files.write(path, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            logInfo("✓ Exported " + path.getFileName() + " [" + content.length + " bytes]");
        } catch (Exception e) {
            logWarn("Failed to write language file " + path + ": " + e.getMessage());
        }
    }

    /**
     * Verifies the target file on disk against the expected SHA-256 checksum of the embedded resource.
     * Updates or creates the file if the checksum differs or if the file is missing.
     *
     * @return true if the file was written or updated, false if it was already valid.
     */
    private static boolean verifyAndSyncResource(String resourcePath, Path destinationPath) {
        try (InputStream in = WebAssetAutoInstaller.class.getResourceAsStream(resourcePath)) {
            if (in == null) {
                logWarn("Embedded resource not found in mod JAR: " + resourcePath);
                return false;
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                baos.write(buffer, 0, read);
            }
            byte[] bundledBytes = baos.toByteArray();
            String bundledChecksum = computeSha256(bundledBytes);
            String fileName = destinationPath.getFileName().toString();

            if (Files.exists(destinationPath)) {
                byte[] diskBytes = Files.readAllBytes(destinationPath);
                String diskChecksum = computeSha256(diskBytes);

                if (bundledChecksum.equalsIgnoreCase(diskChecksum)) {
                    logInfo("✓ " + fileName + " integrity verified [SHA-256: " + bundledChecksum.substring(0, 16) + "...] (up-to-date).");
                    return false;
                } else {
                    logInfo("! Checksum mismatch for " + fileName + " (disk: " + diskChecksum.substring(0, 8) + "... != expected: " + bundledChecksum.substring(0, 8) + "...). Upgrading file...");
                }
            } else {
                logInfo("+ Initial installation of " + fileName + " [SHA-256: " + bundledChecksum.substring(0, 16) + "]...");
            }

            Path parent = destinationPath.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }

            Files.write(destinationPath, bundledBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            logInfo("✓ " + fileName + " written successfully [SHA-256: " + bundledChecksum + "].");
            return true;
        } catch (Exception e) {
            logError("Failed to verify/sync resource '" + resourcePath + "' to '" + destinationPath + "': " + e.getMessage(), e);
            return false;
        }
    }

    private static String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 MessageDigest is not available in current JVM", e);
        }
    }

    private static void patchWebappConf(Path webappConfPath) {
        try {
            if (!Files.exists(webappConfPath)) {
                // If webapp.conf does not exist yet, create a default minimal file
                Path parent = webappConfPath.getParent();
                if (parent != null && !Files.exists(parent)) {
                    Files.createDirectories(parent);
                }

                String initialConf = """
                    ##                          ##
                    ##         BlueMap          ##
                    ##      Webapp-Config       ##
                    ##                          ##

                    enabled: true
                    webroot: "bluemap/web"

                    scripts: [
                      "js/millenaire_panel.js"
                    ]

                    styles: [
                      "css/millenaire_panel.css"
                    ]
                    """;
                Files.writeString(webappConfPath, initialConf, StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
                logInfo("Created '" + webappConfPath + "' with Millénaire Bridge scripts and styles enabled.");
                return;
            }

            String content = Files.readString(webappConfPath, StandardCharsets.UTF_8);
            boolean modified = false;

            // 1. Inject JavaScript reference
            if (!content.contains(JS_TARGET_NAME)) {
                Matcher m = Pattern.compile("(?m)^(\\s*scripts\\s*:\\s*\\[)([\\s\\S]*?)(\\])").matcher(content);
                if (m.find()) {
                    String inner = m.group(2).trim();
                    String newInner = inner.isEmpty()
                            ? "\n  \"" + JS_TARGET_NAME + "\"\n"
                            : "\n" + m.group(2).replaceAll("\\s+$", "") + "\n  \"" + JS_TARGET_NAME + "\"\n";
                    content = content.substring(0, m.start()) + m.group(1) + newInner + m.group(3) + content.substring(m.end());
                    modified = true;
                } else {
                    Matcher mComm = Pattern.compile("(?m)^#\\s*scripts\\s*:\\s*\\[[\\s\\S]*?^#\\s*\\]").matcher(content);
                    if (mComm.find()) {
                        content = content.substring(0, mComm.start()) + "scripts: [\n  \"" + JS_TARGET_NAME + "\"\n]" + content.substring(mComm.end());
                        modified = true;
                    } else {
                        content += "\nscripts: [\n  \"" + JS_TARGET_NAME + "\"\n]\n";
                        modified = true;
                    }
                }
            }

            // 2. Inject CSS reference
            if (!content.contains(CSS_TARGET_NAME)) {
                Matcher m = Pattern.compile("(?m)^(\\s*styles\\s*:\\s*\\[)([\\s\\S]*?)(\\])").matcher(content);
                if (m.find()) {
                    String inner = m.group(2).trim();
                    String newInner = inner.isEmpty()
                            ? "\n  \"" + CSS_TARGET_NAME + "\"\n"
                            : "\n" + m.group(2).replaceAll("\\s+$", "") + "\n  \"" + CSS_TARGET_NAME + "\"\n";
                    content = content.substring(0, m.start()) + m.group(1) + newInner + m.group(3) + content.substring(m.end());
                    modified = true;
                } else {
                    Matcher mComm = Pattern.compile("(?m)^#\\s*styles\\s*:\\s*\\[[\\s\\S]*?^#\\s*\\]").matcher(content);
                    if (mComm.find()) {
                        content = content.substring(0, mComm.start()) + "styles: [\n  \"" + CSS_TARGET_NAME + "\"\n]" + content.substring(mComm.end());
                        modified = true;
                    } else {
                        content += "\nstyles: [\n  \"" + CSS_TARGET_NAME + "\"\n]\n";
                        modified = true;
                    }
                }
            }

            if (modified) {
                Files.writeString(webappConfPath, content, StandardCharsets.UTF_8, StandardOpenOption.TRUNCATE_EXISTING);
                logInfo("Automatically patched '" + webappConfPath + "' to enable Millénaire scripts and styles.");
            }
        } catch (Exception e) {
            logWarn("Failed to patch '" + webappConfPath + "': " + e.getMessage());
        }
    }
}
