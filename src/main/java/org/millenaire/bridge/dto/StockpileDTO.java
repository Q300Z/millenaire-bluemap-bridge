package org.millenaire.bridge.dto;

import java.util.Map;

public record StockpileDTO(
    int goldDeniers,
    int silverDeniers,
    int copperDeniers,
    int totalWood,
    int totalStone,
    int totalFood,
    Map<String, Integer> constructionMaterials,
    Map<String, Integer> foodReserves
) {}
