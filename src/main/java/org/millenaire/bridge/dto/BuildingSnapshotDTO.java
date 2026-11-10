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
    boolean isSubBuilding
) {}
