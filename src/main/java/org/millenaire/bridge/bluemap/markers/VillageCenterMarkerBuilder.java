package org.millenaire.bridge.bluemap.markers;

import com.flowpowered.math.vector.Vector2i;
import com.flowpowered.math.vector.Vector3d;
import de.bluecolored.bluemap.api.markers.HtmlMarker;
import org.millenaire.bridge.dto.VillageSnapshotDTO;

public class VillageCenterMarkerBuilder {

    public static HtmlMarker buildBadge(VillageSnapshotDTO village) {
        String cultureIcon = getCultureIcon(village.cultureId());
        String cssClass = village.cultureId() != null ? village.cultureId().replaceAll("[^a-zA-Z0-9_-]", "-") : "millenaire-default";

        String html = """
            <div class="millenaire-village-badge millenaire-marker-badge %s" data-village-id="%s">
                <div class="badge-icon">%s</div>
                <div class="badge-content">
                    <span class="village-title">%s</span>
                    <span class="pop-pill">%d 👤</span>
                </div>
            </div>
            """.formatted(
                cssClass,
                village.id().toString(),
                cultureIcon,
                escapeHtml(village.name()),
                village.population()
            );

        return HtmlMarker.builder()
            .label(village.name())
            .position(new Vector3d(village.centerX(), village.centerY() + 10.0, village.centerZ()))
            .html(html)
            .anchor(new Vector2i(0, 0))
            .styleClasses("millenaire-badge-anchor")
            .build();
    }

    private static String getCultureIcon(String cultureId) {
        if (cultureId == null) return "🏛️";
        return switch (cultureId) {
            case "millenaire:norman" -> "⚔️";
            case "millenaire:byzantines" -> "👑";
            case "millenaire:japanese" -> "⛩️";
            case "millenaire:mayan" -> "☀️";
            case "millenaire:indian", "millenaire:hindi" -> "🪷";
            case "millenaire:inuits" -> "❄️";
            case "millenaire:seljuk" -> "🌙";
            default -> "🏛️";
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
