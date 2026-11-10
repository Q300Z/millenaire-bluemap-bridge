package org.millenaire.bridge.bluemap.markers;

import com.flowpowered.math.vector.Vector2i;
import com.flowpowered.math.vector.Vector3d;
import de.bluecolored.bluemap.api.markers.HtmlMarker;
import de.bluecolored.bluemap.api.markers.LineMarker;
import de.bluecolored.bluemap.api.math.Color;
import de.bluecolored.bluemap.api.math.Line;
import org.millenaire.bridge.dto.DiplomaticRelationDTO;

public class DiplomaticLineMarkerBuilder {

    public static LineMarker buildArc(DiplomaticRelationDTO rel) {
        if (rel == null || rel.sourceCenter() == null || rel.targetCenter() == null) {
            return null;
        }

        Line.Builder lineBuilder = Line.builder();
        int steps = 16;

        double x0 = rel.sourceCenter().getX();
        double y0 = rel.sourceCenter().getY() + 4.0;
        double z0 = rel.sourceCenter().getZ();

        double x1 = rel.targetCenter().getX();
        double y1 = rel.targetCenter().getY() + 4.0;
        double z1 = rel.targetCenter().getZ();

        double dist = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(z1 - z0, 2));
        double apexHeight = Math.min(120.0, Math.max(25.0, dist * 0.08));

        for (int i = 0; i <= steps; i++) {
            double t = (double) i / steps;
            double x = x0 + t * (x1 - x0);
            double z = z0 + t * (z1 - z0);
            double baseY = y0 + t * (y1 - y0);
            double arcY = baseY + 4.0 * apexHeight * t * (1.0 - t);
            lineBuilder.addPoint(new Vector3d(x, arcY, z));
        }

        Color statusColor = getRelationColor(rel.score());
        int width = (Math.abs(rel.score()) >= 70) ? 3 : 2;
        String signedScore = rel.score() > 0 ? ("+" + rel.score()) : String.valueOf(rel.score());

        return LineMarker.builder()
            .label(rel.sourceName() + " ↔ " + rel.targetName() + " [" + rel.statusLabel() + "]")
            .line(lineBuilder.build())
            .lineColor(statusColor)
            .lineWidth(width)
            .depthTestEnabled(false)
            .maxDistance(5000.0)
            .detail("<b>Diplomatie</b> : " + escapeHtml(rel.sourceName()) + " ↔ " + escapeHtml(rel.targetName())
                + "<br>Statut : <b>" + escapeHtml(rel.statusLabel()) + "</b> (" + signedScore + ")")
            .build();
    }

    public static HtmlMarker buildMidpointBadge(DiplomaticRelationDTO rel) {
        if (rel == null || rel.sourceCenter() == null || rel.targetCenter() == null) {
            return null;
        }

        double x0 = rel.sourceCenter().getX();
        double y0 = rel.sourceCenter().getY() + 4.0;
        double z0 = rel.sourceCenter().getZ();

        double x1 = rel.targetCenter().getX();
        double y1 = rel.targetCenter().getY() + 4.0;
        double z1 = rel.targetCenter().getZ();

        double dist = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(z1 - z0, 2));
        double apexHeight = Math.min(120.0, Math.max(25.0, dist * 0.08));

        double midX = 0.5 * (x0 + x1);
        double midZ = 0.5 * (z0 + z1);
        double midY = 0.5 * (y0 + y1) + apexHeight + 2.0;

        String icon = getRelationIcon(rel.score());
        String signedScore = rel.score() > 0 ? ("+" + rel.score()) : String.valueOf(rel.score());
        String colorHex = (rel.colorHex() != null && rel.colorHex().matches("^#[0-9a-fA-F]{3,8}$")) ? rel.colorHex() : "#bdc3c7";

        String html = """
            <div class="millenaire-diplo-badge" style="border-color: %s" data-source-id="%s" data-target-id="%s" title="%s ↔ %s : %s (%s)">
                <span>%s</span>
                <span>%s</span>
            </div>
            """.formatted(
                colorHex,
                rel.sourceVillageId().toString(),
                rel.targetVillageId().toString(),
                escapeHtml(rel.sourceName()),
                escapeHtml(rel.targetName()),
                escapeHtml(rel.statusLabel()),
                signedScore,
                icon,
                signedScore
            );

        return HtmlMarker.builder()
            .label(rel.sourceName() + " ↔ " + rel.targetName() + " (" + signedScore + ")")
            .position(new Vector3d(midX, midY, midZ))
            .html(html)
            .anchor(new Vector2i(0, 0))
            .styleClasses("millenaire-diplo-anchor")
            .listed(false)
            .maxDistance(2500.0)
            .build();
    }

    private static String getRelationIcon(int score) {
        if (score >= 70) return "🤝";
        if (score >= 30) return "🕊️";
        if (score >= -10) return "⚖️";
        if (score >= -50) return "⚠️";
        return "⚔️";
    }

    private static Color getRelationColor(int score) {
        if (score >= 70)  return new Color(46, 204, 113, 0.90f);  // Green (Allied)
        if (score >= 30)  return new Color(52, 152, 219, 0.85f);  // Blue (Friendly)
        if (score >= -10) return new Color(189, 195, 199, 0.65f); // Grey (Neutral)
        if (score >= -50) return new Color(230, 126, 34, 0.85f);  // Orange (Hostile)
        return new Color(192, 57, 43, 0.95f);                     // Red (Open War)
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
