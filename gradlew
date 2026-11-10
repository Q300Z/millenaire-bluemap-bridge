#!/usr/bin/env bash
# ==============================================================================
# Gradle Wrapper Shim for Millénaire BlueMap Bridge
#
# Delegates test and build tasks cleanly to the native build.sh pipeline.
# Satisfies requirement R3 for automated testing and CI tool interoperability.
# Author: Q300Z
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_SCRIPT="${SCRIPT_DIR}/build.sh"

if [ ! -x "${BUILD_SCRIPT}" ]; then
    chmod +x "${BUILD_SCRIPT}"
fi

exec "${BUILD_SCRIPT}" "$@"
