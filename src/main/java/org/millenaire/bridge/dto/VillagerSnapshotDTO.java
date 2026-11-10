package org.millenaire.bridge.dto;

import java.util.UUID;

public record VillagerSnapshotDTO(
    UUID uuid,
    String name,
    String role,
    String homeBuilding,
    boolean isCombatant,
    boolean isRaiding,
    boolean isHired,
    boolean isKilled,
    int militaryStrength
) {}
