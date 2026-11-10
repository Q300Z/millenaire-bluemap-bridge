#!/usr/bin/env bash
# ==============================================================================
# Build & Test Pipeline for Millénaire BlueMap Bridge
#
# Fully agnostic, portable build script for Linux, macOS, and Windows (WSL/Git Bash).
# Automatically discovers JDK 25+, local Minecraft/NeoForge libraries, and mods.
#
# Author: Q300Z
# ==============================================================================
set -euo pipefail

# 1. Self-contained project directory resolution
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_DIR}"

VERSION="$(cat "${PROJECT_DIR}/version.txt" 2>/dev/null || echo "0.1.0")"
VERSION="${VERSION//[[:space:]]/}"

LIBS_DIR="${PROJECT_DIR}/libs"
BUILD_DIR="${PROJECT_DIR}/build"
BUILD_CLASSES="${BUILD_DIR}/classes"
BUILD_TEST_CLASSES="${BUILD_DIR}/test-classes"
BUILD_OUTPUT_DIR="${BUILD_DIR}/libs"

# 2. Portable JDK 25+ Discovery
get_jdk_version() {
    local javac_bin="$1"
    if [ -x "$javac_bin" ]; then
        local ver_token
        ver_token="$("$javac_bin" -version 2>&1 | grep -oE '[0-9]+' | head -1)"
        if [ -n "$ver_token" ]; then
            echo "$ver_token"
            return
        fi
    fi
    echo "0"
}

find_suitable_jdk() {
    # a. Check user-defined JAVA_HOME
    if [ -n "${JAVA_HOME:-}" ] && [ -x "${JAVA_HOME}/bin/javac" ]; then
        local ver
        ver="$(get_jdk_version "${JAVA_HOME}/bin/javac")"
        if [ "$ver" -ge 25 ]; then
            echo "${JAVA_HOME}"
            return
        fi
    fi

    # b. Check system default javac in PATH
    local sys_javac
    sys_javac="$(command -v javac 2>/dev/null || true)"
    if [ -n "$sys_javac" ] && [ -x "$sys_javac" ]; then
        local ver
        ver="$(get_jdk_version "$sys_javac")"
        if [ "$ver" -ge 25 ]; then
            echo "$(dirname "$(dirname "$sys_javac")")"
            return
        fi
    fi

    # c. Scan standard JVM installation paths across platforms
    local search_paths=(
        /usr/lib/jvm/*
        /usr/java/*
        /opt/java/*
        /opt/jvm/*
        /Library/Java/JavaVirtualMachines/*/Contents/Home
        "${HOME}/Library/Java/JavaVirtualMachines/*/Contents/Home"
        "${HOME}/.jdks/*"
        "${HOME}/.sdkman/candidates/java/*"
        "${HOME}/.asdf/installs/java/*"
        "/c/Program Files/Java"/*
        "/c/Program Files/Eclipse Adoptium"/*
    )

    local best_home=""
    local best_ver=0

    for candidate in "${search_paths[@]}"; do
        if [ -d "$candidate" ] && [ -x "$candidate/bin/javac" ]; then
            local ver
            ver="$(get_jdk_version "$candidate/bin/javac")"
            if [ "$ver" -ge 25 ] && [ "$ver" -gt "$best_ver" ]; then
                best_ver="$ver"
                best_home="$candidate"
            fi
        fi
    done

    echo "$best_home"
}

DETECTED_JAVA_HOME="$(find_suitable_jdk)"

if [ -n "$DETECTED_JAVA_HOME" ] && [ -x "$DETECTED_JAVA_HOME/bin/javac" ]; then
    JAVAC_BIN="$DETECTED_JAVA_HOME/bin/javac"
    JAVA_BIN="$DETECTED_JAVA_HOME/bin/java"
    JAR_BIN="$DETECTED_JAVA_HOME/bin/jar"
else
    echo "::error::Aucun JDK version 25 ou supérieure trouvé sur votre système." >&2
    echo "Veuillez installer un JDK 25+ ou définir la variable JAVA_HOME." >&2
    exit 1
fi

# 3. Dynamic Resolution of Mods and Libraries Directories
find_meta_libs_dir() {
    if [ -n "${MINECRAFT_LIBRARIES:-}" ] && [ -d "$MINECRAFT_LIBRARIES" ]; then
        echo "$MINECRAFT_LIBRARIES"
        return
    fi
    if [ -n "${MODRINTH_LIBRARIES:-}" ] && [ -d "$MODRINTH_LIBRARIES" ]; then
        echo "$MODRINTH_LIBRARIES"
        return
    fi

    local standard_locations=(
        "${XDG_DATA_HOME:-$HOME/.local/share}/ModrinthApp/meta/libraries"
        "$HOME/Library/Application Support/ModrinthApp/meta/libraries"
        "${APPDATA:-}/ModrinthApp/meta/libraries"
        "$HOME/.minecraft/libraries"
        "${XDG_DATA_HOME:-$HOME/.local/share}/PrismLauncher/libraries"
        "$HOME/.local/share/PrismLauncher/libraries"
        "$HOME/.m2/repository"
        "${LIBS_DIR}"
    )

    for loc in "${standard_locations[@]}"; do
        if [ -n "$loc" ] && [ -d "$loc" ]; then
            echo "$loc"
            return
        fi
    done

    echo "${LIBS_DIR}"
}

META_LIBS="$(find_meta_libs_dir)"

MOD_SEARCH_DIRS=(
    "${MODS_DIR:-}"
    "${PROJECT_DIR}/../mods"
    "${PROJECT_DIR}/mods"
    "${LIBS_DIR}"
)

find_mod_jar() {
    local pattern="$1"
    for dir in "${MOD_SEARCH_DIRS[@]}"; do
        if [ -n "$dir" ] && [ -d "$dir" ]; then
            local match
            match="$(find "$dir" -maxdepth 2 -name "$pattern" ! -name "*bridge*" 2>/dev/null | sort -V | tail -n1)"
            if [ -n "$match" ] && [ -f "$match" ]; then
                echo "$match"
                return
            fi
        fi
    done
    echo ""
}

find_meta_lib() {
    local pattern="$1"
    if [ -d "$META_LIBS" ]; then
        local match
        match="$(find "$META_LIBS" -name "$pattern" 2>/dev/null | sort -V | tail -n1)"
        if [ -n "$match" ] && [ -f "$match" ]; then
            echo "$match"
            return
        fi
    fi
    if [ -d "$LIBS_DIR" ]; then
        local match
        match="$(find "$LIBS_DIR" -name "$pattern" 2>/dev/null | sort -V | tail -n1)"
        if [ -n "$match" ] && [ -f "$match" ]; then
            echo "$match"
            return
        fi
    fi
    echo ""
}

MILLENAIRE_JAR="$(find_mod_jar "millenaire-*.jar")"
BLUEMAP_JAR="$(find_mod_jar "bluemap-*.jar")"

# Dynamic Resolution of NeoForge & Core Libraries
FLOW_MATH_JAR="${LIBS_DIR}/flow-math-1.0.3.jar"
MC_PATCHED_JAR="$(find_meta_lib "*minecraft-client-patched*.jar")"
NEOFORGE_JAR="$(find_meta_lib "*neoforge*universal*.jar")"
BUS_JAR="$(find_meta_lib "*bus*.jar")"
FML_LOADER_JAR="$(find_meta_lib "*loader*.jar")"
LOG4J_API_JAR="$(find_meta_lib "*log4j-api*.jar")"
LOG4J_CORE_JAR="$(find_meta_lib "*log4j-core*.jar")"
GSON_JAR="$(find_meta_lib "*gson*.jar")"
FASTUTIL_JAR="$(find_meta_lib "*fastutil*.jar")"
DFU_JAR="$(find_meta_lib "*datafixerupper*.jar")"

# Build Classpath dynamically (joining only non-empty elements)
CP_ELEMENTS=(
    "$MILLENAIRE_JAR"
    "$BLUEMAP_JAR"
    "$FLOW_MATH_JAR"
    "$MC_PATCHED_JAR"
    "$NEOFORGE_JAR"
    "$BUS_JAR"
    "$FML_LOADER_JAR"
    "$LOG4J_API_JAR"
    "$GSON_JAR"
    "$DFU_JAR"
    "$FASTUTIL_JAR"
)

CP=""
for elem in "${CP_ELEMENTS[@]}"; do
    if [ -n "$elem" ]; then
        if [ -z "$CP" ]; then
            CP="$elem"
        else
            CP="${CP}:${elem}"
        fi
    fi
done

ensure_dependencies() {
    mkdir -p "${LIBS_DIR}" "${BUILD_CLASSES}" "${BUILD_TEST_CLASSES}" "${BUILD_OUTPUT_DIR}"
    
    # If flow-math is missing from libs, extract it automatically from BlueMap JAR without requiring python
    if [ ! -f "${FLOW_MATH_JAR}" ] && [ -n "${BLUEMAP_JAR}" ] && [ -f "${BLUEMAP_JAR}" ]; then
        local tmp_extract
        tmp_extract="$(mktemp -d)"
        (
            cd "$tmp_extract"
            "$JAR_BIN" xf "${BLUEMAP_JAR}" "META-INF/jarjar/flow-math-1.0.3.jar" 2>/dev/null || true
            if [ -f "META-INF/jarjar/flow-math-1.0.3.jar" ]; then
                mv "META-INF/jarjar/flow-math-1.0.3.jar" "${FLOW_MATH_JAR}"
            fi
        )
        rm -rf "$tmp_extract"
    fi
}

compile_main() {
    ensure_dependencies
    echo "Compiling main Java sources (--release 25, version: ${VERSION})..."
    mapfile -t MAIN_SOURCES < <(find "${PROJECT_DIR}/src/main/java" -name "*.java")
    "$JAVAC_BIN" --release 25 -encoding UTF-8 \
      -cp "$CP" \
      -d "${BUILD_CLASSES}" \
      "${MAIN_SOURCES[@]}"

    echo "Copying main resources..."
    cp -a "${PROJECT_DIR}/src/main/resources/." "${BUILD_CLASSES}/"

    # Inject version into neoforge.mods.toml
    if [ -f "${BUILD_CLASSES}/META-INF/neoforge.mods.toml" ]; then
        sed -i "s/version=\"[^\"]*\"/version=\"${VERSION}\"/g" "${BUILD_CLASSES}/META-INF/neoforge.mods.toml"
    fi
}

run_tests() {
    echo "Compiling test Java sources..."
    mkdir -p "${BUILD_TEST_CLASSES}"
    local test_cp="${BUILD_CLASSES}:$CP"

    mapfile -t TEST_SOURCES < <(find "${PROJECT_DIR}/src/test/java" -name "*.java")
    "$JAVAC_BIN" --release 25 -encoding UTF-8 \
      -cp "$test_cp" \
      -d "${BUILD_TEST_CLASSES}" \
      "${TEST_SOURCES[@]}"

    echo "Executing TranslationValidationTest..."
    local run_test_cp="${BUILD_TEST_CLASSES}:${BUILD_CLASSES}:$CP"
    if [ -n "$LOG4J_CORE_JAR" ]; then
        run_test_cp="${run_test_cp}:${LOG4J_CORE_JAR}"
    fi

    "$JAVA_BIN" -cp "$run_test_cp" org.millenaire.bridge.test.TranslationValidationTest
}

package_jar() {
    echo "Packaging mod JAR (version ${VERSION})..."
    mkdir -p "${BUILD_CLASSES}/META-INF"
    cat << EOF > "${BUILD_CLASSES}/META-INF/MANIFEST.MF"
Manifest-Version: 1.0
Main-Class: org.millenaire.bridge.installer.WebAssetAutoInstaller
Implementation-Title: Millenaire BlueMap Bridge
Implementation-Version: ${VERSION}
Implementation-Vendor: Q300Z
EOF

    local target_jar="${BUILD_OUTPUT_DIR}/millenaire-bluemap-bridge-${VERSION}.jar"
    "$JAR_BIN" cfm "${target_jar}" "${BUILD_CLASSES}/META-INF/MANIFEST.MF" -C "${BUILD_CLASSES}" .
    
    # Mirror into libs/ for CI release workflow
    rm -f "${LIBS_DIR}"/millenaire-bluemap-bridge-*.jar
    cp "${target_jar}" "${LIBS_DIR}/millenaire-bluemap-bridge-${VERSION}.jar"
    
    # Mirror into Minecraft instance mods/ directory if present
    if [ -n "${MODS_DIR:-}" ] && [ -d "${MODS_DIR}" ]; then
        rm -f "${MODS_DIR}"/millenaire-bluemap-bridge-*.jar
        cp "${target_jar}" "${MODS_DIR}/millenaire-bluemap-bridge-${VERSION}.jar"
    elif [ -d "${PROJECT_DIR}/../mods" ]; then
        rm -f "${PROJECT_DIR}/../mods"/millenaire-bluemap-bridge-*.jar
        cp "${target_jar}" "${PROJECT_DIR}/../mods/millenaire-bluemap-bridge-${VERSION}.jar"
    fi

    echo "Built ${target_jar} successfully."
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
        rm -rf "${BUILD_DIR}"
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
