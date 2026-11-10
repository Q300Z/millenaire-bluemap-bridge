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
    int militaryStrength,
    String roleKey
) {
    public VillagerSnapshotDTO(
        UUID uuid,
        String name,
        String role,
        String homeBuilding,
        boolean isCombatant,
        boolean isRaiding,
        boolean isHired,
        boolean isKilled,
        int militaryStrength
    ) {
        this(uuid, name, role, homeBuilding, isCombatant, isRaiding, isHired, isKilled, militaryStrength, null);
    }
}
