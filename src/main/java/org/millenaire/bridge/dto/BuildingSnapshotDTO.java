package org.millenaire.bridge.dto;

public record BuildingSnapshotDTO(
    String id,
    String name,
    String planId,
    int level,
    int x,
    int y,
    int z,
    boolean isUnderConstruction,
    boolean isSubBuilding,
    String planKey
) {
    public BuildingSnapshotDTO(
        String id,
        String name,
        String planId,
        int level,
        int x,
        int y,
        int z,
        boolean isUnderConstruction,
        boolean isSubBuilding
    ) {
        this(id, name, planId, level, x, y, z, isUnderConstruction, isSubBuilding, null);
    }
}
