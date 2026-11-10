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
    double distance
) {
    public record CenterPos(int x, int y, int z) {
        public int getX() { return x; }
        public int getY() { return y; }
        public int getZ() { return z; }
    }
}
