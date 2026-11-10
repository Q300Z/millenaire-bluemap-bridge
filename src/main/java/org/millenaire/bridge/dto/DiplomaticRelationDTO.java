package org.millenaire.bridge.dto;

import java.util.UUID;

public record DiplomaticRelationDTO(
    UUID sourceVillageId,
    String sourceName,
    CenterPos sourceCenter,
    UUID targetVillageId,
    String targetName,
    String targetCultureName,
    CenterPos targetCenter,
    int score,
    String statusLabel,
    String colorHex,
    double distance,
    String targetCultureKey,
    String statusKey
) {
    public DiplomaticRelationDTO(
        UUID sourceVillageId,
        String sourceName,
        CenterPos sourceCenter,
        UUID targetVillageId,
        String targetName,
        String targetCultureName,
        CenterPos targetCenter,
        int score,
        String statusLabel,
        String colorHex,
        double distance
    ) {
        this(sourceVillageId, sourceName, sourceCenter, targetVillageId, targetName, targetCultureName,
             targetCenter, score, statusLabel, colorHex, distance, null, null);
    }

    public record CenterPos(int x, int y, int z) {
        public int getX() { return x; }
        public int getY() { return y; }
        public int getZ() { return z; }
    }
}
