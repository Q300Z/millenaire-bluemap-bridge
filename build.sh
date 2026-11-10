#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
rm -rf millenaire-bluemap-bridge/build/classes
mkdir -p millenaire-bluemap-bridge/libs millenaire-bluemap-bridge/build/classes

if [ ! -f millenaire-bluemap-bridge/libs/flow-math-1.0.3.jar ]; then
    python3 -c '
import zipfile
with zipfile.ZipFile("mods/bluemap-5.29-neoforge.jar", "r") as z:
    open("millenaire-bluemap-bridge/libs/flow-math-1.0.3.jar", "wb").write(z.read("META-INF/jarjar/flow-math-1.0.3.jar"))
'
fi

JAVAC_BIN="/usr/lib/jvm/java-27-openjdk/bin/javac"
JAR_BIN="/usr/lib/jvm/java-27-openjdk/bin/jar"
META_LIBS="/home/tboutin/.local/share/ModrinthApp/meta/libraries"

CP="mods/millenaire-9.1.0+mc26.3.jar:mods/bluemap-5.29-neoforge.jar:millenaire-bluemap-bridge/libs/flow-math-1.0.3.jar:${META_LIBS}/net/neoforged/minecraft-client-patched/26.3.0.102/minecraft-client-patched-26.3.0.102.jar:${META_LIBS}/net/neoforged/neoforge/26.3.0.102/neoforge-26.3.0.102-universal.jar:${META_LIBS}/net/neoforged/bus/8.0.5/bus-8.0.5.jar:${META_LIBS}/net/neoforged/fancymodloader/loader/12.0.12/loader-12.0.12.jar:${META_LIBS}/org/apache/logging/log4j/log4j-api/2.26.0/log4j-api-2.26.0.jar:${META_LIBS}/com/google/code/gson/gson/2.14.0/gson-2.14.0.jar:${META_LIBS}/com/mojang/datafixerupper/10.0.21/datafixerupper-10.0.21.jar:${META_LIBS}/it/unimi/dsi/fastutil/8.5.18/fastutil-8.5.18.jar"

"$JAVAC_BIN" --release 25 -encoding UTF-8 \
  -cp "$CP" \
  -d millenaire-bluemap-bridge/build/classes \
  $(find millenaire-bluemap-bridge/src/main/java -name "*.java")

cp -r millenaire-bluemap-bridge/src/main/resources/* millenaire-bluemap-bridge/build/classes/
"$JAR_BIN" cf mods/millenaire-bluemap-bridge-1.0.0.jar -C millenaire-bluemap-bridge/build/classes .
echo "Built mods/millenaire-bluemap-bridge-1.0.0.jar successfully."
