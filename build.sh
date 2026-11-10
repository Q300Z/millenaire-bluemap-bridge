#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

SCRIPT_DIR="millenaire-bluemap-bridge"
LIBS_DIR="${SCRIPT_DIR}/libs"
BUILD_CLASSES="${SCRIPT_DIR}/build/classes"
BUILD_TEST_CLASSES="${SCRIPT_DIR}/build/test-classes"

META_LIBS="/home/tboutin/.local/share/ModrinthApp/meta/libraries"

if [ -d "/usr/lib/jvm/java-27-openjdk" ]; then
    JAVA_HOME_DEFAULT="/usr/lib/jvm/java-27-openjdk"
elif [ -n "${JAVA_HOME:-}" ]; then
    JAVA_HOME_DEFAULT="$JAVA_HOME"
else
    JAVA_HOME_DEFAULT=""
fi

if [ -n "$JAVA_HOME_DEFAULT" ] && [ -x "$JAVA_HOME_DEFAULT/bin/javac" ]; then
    JAVAC_BIN="$JAVA_HOME_DEFAULT/bin/javac"
    JAVA_BIN="$JAVA_HOME_DEFAULT/bin/java"
    JAR_BIN="$JAVA_HOME_DEFAULT/bin/jar"
else
    JAVAC_BIN="$(command -v javac)"
    JAVA_BIN="$(command -v java)"
    JAR_BIN="$(command -v jar)"
fi

CP="mods/millenaire-9.1.0+mc26.3.jar:mods/bluemap-5.29-neoforge.jar:${LIBS_DIR}/flow-math-1.0.3.jar:${META_LIBS}/net/neoforged/minecraft-client-patched/26.3.0.102/minecraft-client-patched-26.3.0.102.jar:${META_LIBS}/net/neoforged/neoforge/26.3.0.102/neoforge-26.3.0.102-universal.jar:${META_LIBS}/net/neoforged/bus/8.0.5/bus-8.0.5.jar:${META_LIBS}/net/neoforged/fancymodloader/loader/12.0.12/loader-12.0.12.jar:${META_LIBS}/org/apache/logging/log4j/log4j-api/2.26.0/log4j-api-2.26.0.jar:${META_LIBS}/com/google/code/gson/gson/2.14.0/gson-2.14.0.jar:${META_LIBS}/com/mojang/datafixerupper/10.0.21/datafixerupper-10.0.21.jar:${META_LIBS}/it/unimi/dsi/fastutil/8.5.18/fastutil-8.5.18.jar"

ensure_dependencies() {
    mkdir -p "${LIBS_DIR}" "${BUILD_CLASSES}" "${BUILD_TEST_CLASSES}"
    if [ ! -f "${LIBS_DIR}/flow-math-1.0.3.jar" ]; then
        python3 -c '
import zipfile
with zipfile.ZipFile("mods/bluemap-5.29-neoforge.jar", "r") as z:
    open("'"${LIBS_DIR}"'/flow-math-1.0.3.jar", "wb").write(z.read("META-INF/jarjar/flow-math-1.0.3.jar"))
'
    fi
}

compile_main() {
    ensure_dependencies
    echo "Compiling main Java sources (--release 25)..."
    "$JAVAC_BIN" --release 25 -encoding UTF-8 \
      -cp "$CP" \
      -d "${BUILD_CLASSES}" \
      $(find "${SCRIPT_DIR}/src/main/java" -name "*.java")

    echo "Copying main resources..."
    cp -r "${SCRIPT_DIR}/src/main/resources/"* "${BUILD_CLASSES}/"
}

run_tests() {
    echo "Compiling test Java sources..."
    mkdir -p "${BUILD_TEST_CLASSES}"
    TEST_CP="${BUILD_CLASSES}:$CP"

    "$JAVAC_BIN" --release 25 -encoding UTF-8 \
      -cp "$TEST_CP" \
      -d "${BUILD_TEST_CLASSES}" \
      $(find "${SCRIPT_DIR}/src/test/java" -name "*.java")

    echo "Executing TranslationValidationTest..."
    LOG4J_CORE="${META_LIBS}/org/apache/logging/log4j/log4j-core/2.26.0/log4j-core-2.26.0.jar"
    RUN_TEST_CP="${BUILD_TEST_CLASSES}:${BUILD_CLASSES}:$CP:${LOG4J_CORE}"

    "$JAVA_BIN" -cp "$RUN_TEST_CP" org.millenaire.bridge.test.TranslationValidationTest
}

package_jar() {
    echo "Packaging mod JAR..."
    mkdir -p "${BUILD_CLASSES}/META-INF"
    cat << 'EOF' > "${BUILD_CLASSES}/META-INF/MANIFEST.MF"
Manifest-Version: 1.0
Main-Class: org.millenaire.bridge.installer.WebAssetAutoInstaller
Implementation-Title: Millenaire BlueMap Bridge
Implementation-Version: 1.0.0
Implementation-Vendor: Q300Z
EOF

    "$JAR_BIN" cfm mods/millenaire-bluemap-bridge-1.0.0.jar "${BUILD_CLASSES}/META-INF/MANIFEST.MF" -C "${BUILD_CLASSES}" .
    cp mods/millenaire-bluemap-bridge-1.0.0.jar "${LIBS_DIR}/millenaire-bluemap-bridge-1.0.0.jar"
    echo "Built mods/millenaire-bluemap-bridge-1.0.0.jar successfully."
}

ACTION="${1:-build}"

case "$ACTION" in
    test|check)
        compile_main
        run_tests
        ;;
    build)
        compile_main
        run_tests
        package_jar
        ;;
    clean)
        echo "Cleaning build directory..."
        rm -rf "${SCRIPT_DIR}/build"
        echo "Cleaned successfully."
        ;;
    help|-h|--help)
        echo "Usage: $0 [build|test|clean|help]"
        echo "  build (default) : Compiles main sources, runs test suite, and packages the mod JAR"
        echo "  test / check    : Compiles main and test sources and runs TranslationValidationTest"
        echo "  clean           : Removes build artifacts"
        ;;
    *)
        echo "Unknown target: $ACTION. Supported targets: build, test, clean" >&2
        exit 1
        ;;
esac
