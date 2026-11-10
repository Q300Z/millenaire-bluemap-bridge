package org.millenaire.bridge.dto;

import java.util.List;

public record ProjectSnapshotDTO(
    String name,
    double progress,
    int currentStep,
    int totalSteps,
    boolean isBlocked,
    List<RequiredResourceDTO> requiredResources
) {}
