package org.millenaire.bridge.installer;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Automates the extraction of BlueMap web assets (JS/CSS) from the mod JAR
 * directly into BlueMap's webroot, and automatically configures config/bluemap/webapp.conf.
 * This eliminates the need for manual file copying or configuration editing.
 *
 * Runs automatically when Minecraft starts, and can also be run standalone via `java -jar`.
 * Zero external dependencies.
 *
 * Author: Q300Z
 */
public final class WebAssetAutoInstaller {

    private static final String PREFIX = "[MillenaireBridge-Installer] ";

    private static final String JS_RESOURCE = "/web/js/millenaire_panel.js";
    private static final String CSS_RESOURCE = "/web/css/millenaire_panel.css";

    private static final String JS_TARGET_NAME = "js/millenaire_panel.js";
    private static final String CSS_TARGET_NAME = "css/millenaire_panel.css";

    private WebAssetAutoInstaller() {}

    public static void main(String[] args) {
        System.out.println(PREFIX + "Starting standalone installation...");
        install();
        System.out.println(PREFIX + "Installation completed.");
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
            logInfo("Checking automatic installation of Millénaire BlueMap web assets...");

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

            // 2. Extract embedded JS & CSS files into webroot
            boolean jsCopied = copyResourceIfChanged(JS_RESOURCE, webrootDir.resolve(JS_TARGET_NAME));
            boolean cssCopied = copyResourceIfChanged(CSS_RESOURCE, webrootDir.resolve(CSS_TARGET_NAME));

            if (jsCopied || cssCopied) {
                logInfo("Millénaire BlueMap web assets deployed successfully to '" + webrootDir + "'");
            } else {
                logInfo("Millénaire BlueMap web assets in '" + webrootDir + "' are already up-to-date.");
            }

            // 3. Automatically patch webapp.conf to include JS and CSS if needed
            patchWebappConf(webappConfPath);

        } catch (Exception e) {
            logError("Failed to execute automatic web asset installation: " + e.getMessage(), e);
        }
    }

    private static boolean copyResourceIfChanged(String resourcePath, Path destinationPath) {
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
            byte[] resourceBytes = baos.toByteArray();

            if (Files.exists(destinationPath)) {
                byte[] existingBytes = Files.readAllBytes(destinationPath);
                if (Arrays.equals(resourceBytes, existingBytes)) {
                    // Content is already up-to-date
                    return false;
                }
            }

            Path parent = destinationPath.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }

            Files.write(destinationPath, resourceBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return true;
        } catch (Exception e) {
            logError("Failed to copy resource '" + resourcePath + "' to '" + destinationPath + "': " + e.getMessage(), e);
            return false;
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
