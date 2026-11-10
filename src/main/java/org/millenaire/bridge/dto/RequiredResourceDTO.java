package org.millenaire.bridge.dto;

public record RequiredResourceDTO(
    String itemId,
    String itemName,
    int required,
    int available
) {}
