package org.millenaire.bridge.dto;

import java.util.List;
import java.util.UUID;

public record VillageSnapshotDTO(
    UUID id,
    String name,
    String cultureId,
    String cultureName,
    String villageTypeId,
    String villageTypeName,
    boolean isLoneBuilding,
    int centerX,
    int centerY,
    int centerZ,
    double boundsMinX,
    double boundsMinY,
    double boundsMinZ,
    double boundsMaxX,
    double boundsMaxY,
    double boundsMaxZ,
    int population,
    int menCount,
    int womenCount,
    int childrenCount,
    int defenseRating,
    int raidStrength,
    boolean isUnderAttack,
    String activeRaidTarget,
    int buildingsCount,
    List<VillagerSnapshotDTO> roster,
    List<BuildingSnapshotDTO> buildingsList,
    List<ProjectSnapshotDTO> projects,
    StockpileDTO stockpiles,
    List<DiplomaticRelationDTO> relations
) {}
