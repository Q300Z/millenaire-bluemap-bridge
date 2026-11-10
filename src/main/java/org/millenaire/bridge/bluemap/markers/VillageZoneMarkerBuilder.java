package org.millenaire.bridge.bluemap.markers;

import de.bluecolored.bluemap.api.markers.ExtrudeMarker;
import de.bluecolored.bluemap.api.math.Color;
import de.bluecolored.bluemap.api.math.Shape;
import org.millenaire.bridge.dto.VillageSnapshotDTO;

public class VillageZoneMarkerBuilder {

    public static ExtrudeMarker buildZone(VillageSnapshotDTO village) {
        Shape zoneShape = Shape.createRect(
            village.boundsMinX() - 4.0,
            village.boundsMinZ() - 4.0,
            village.boundsMaxX() + 4.0,
            village.boundsMaxZ() + 4.0
        );

        Color fillColor = getCultureFillColor(village.cultureId());
        Color outlineColor = getCultureOutlineColor(village.cultureId());
        float minY = (float) village.centerY() - 2.0f;
        float maxY = (float) village.centerY() + 3.0f;

        return ExtrudeMarker.builder()
            .label(village.name() + " (" + village.cultureName() + ")")
            .shape(zoneShape, minY, maxY)
            .fillColor(fillColor)
            .lineColor(outlineColor)
            .lineWidth(2)
            .depthTestEnabled(true)
            .listed(false)
            .detail("<b>" + escapeHtml(village.name()) + "</b><br>Culture : " + escapeHtml(village.cultureName()) + "<br>Population : " + village.population())
            .build();
    }

    private static Color getCultureFillColor(String cultureId) {
        if (cultureId == null) {
            return new Color(149, 165, 166, 0.22f);
        }
        return switch (cultureId) {
            case "millenaire:norman" -> new Color(46, 204, 113, 0.22f);     // Soft Emerald
            case "millenaire:byzantines" -> new Color(52, 152, 219, 0.22f); // Soft Sapphire
            case "millenaire:japanese" -> new Color(231, 76, 60, 0.22f);    // Soft Crimson
            case "millenaire:mayan" -> new Color(241, 196, 15, 0.22f);      // Soft Amber
            case "millenaire:indian", "millenaire:hindi" -> new Color(155, 89, 182, 0.22f); // Soft Amethyst
            case "millenaire:inuits" -> new Color(26, 188, 156, 0.22f);     // Soft Turquoise
            case "millenaire:seljuk" -> new Color(230, 126, 34, 0.22f);     // Soft Terracotta
            default -> new Color(149, 165, 166, 0.22f);
        };
    }

    private static Color getCultureOutlineColor(String cultureId) {
        if (cultureId == null) {
            return new Color(127, 140, 141, 0.88f);
        }
        return switch (cultureId) {
            case "millenaire:norman" -> new Color(39, 174, 96, 0.88f);
            case "millenaire:byzantines" -> new Color(41, 128, 185, 0.88f);
            case "millenaire:japanese" -> new Color(192, 57, 43, 0.88f);
            case "millenaire:mayan" -> new Color(214, 137, 16, 0.88f);
            case "millenaire:indian", "millenaire:hindi" -> new Color(142, 68, 173, 0.88f);
            case "millenaire:inuits" -> new Color(22, 160, 133, 0.88f);
            case "millenaire:seljuk" -> new Color(211, 84, 0, 0.88f);
            default -> new Color(127, 140, 141, 0.88f);
        };
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
