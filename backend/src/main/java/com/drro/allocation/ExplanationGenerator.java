package com.drro.allocation;

import com.drro.entity.RequestItem;
import com.drro.entity.ResourceCenter;
import com.drro.util.PriorityScoreCalculator.ScoreBreakdown;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Generates a human-readable explanation for each allocation decision.
 * This text is stored in allocation_factors.explanation_text for full explainability.
 */
@Component
public class ExplanationGenerator {

    /**
     * Generate a plain-English explanation for why this allocation was made.
     *
     * @param score     the computed score breakdown
     * @param item      the request item being allocated
     * @param center    the resource center supplying the allocation
     * @param allocated quantity being allocated
     * @return human-readable explanation string
     */
    public String generate(ScoreBreakdown score, RequestItem item,
                           ResourceCenter center, BigDecimal allocated) {

        String resourceName = item.getResourceType().getName();
        String unit         = item.getResourceType().getUnit();
        String locationName = item.getRequest().getLocation().getName();
        String urgency      = item.getRequest().getUrgency().name();
        String disasterName = item.getRequest().getDisaster().getTitle();

        StringBuilder sb = new StringBuilder();

        sb.append(String.format(
                "Allocated %.2f %s from '%s' to location '%s' (disaster: %s). ",
                allocated, unit, center.getName(), locationName, disasterName));

        sb.append(String.format("Priority score: %.2f/100. ", score.finalScore()));

        // Severity
        sb.append(String.format("Disaster severity score: %.0f. ", score.severityScore()));

        // Urgency
        sb.append(String.format("Request urgency is %s (urgency score: %.0f). ", urgency, score.urgencyScore()));

        // Population
        sb.append(String.format("Estimated affected population score: %.0f. ", score.populationScore()));

        // Shortage
        sb.append(String.format("Unmet demand (shortage) score: %.0f. ", score.shortageScore()));

        // Distance
        sb.append(String.format("This center is %.1f km away (~%.1f hrs travel, travel score: %.0f). ",
                score.distanceKm(), score.estimatedTravelHrs(), score.travelTimeScore()));

        // Vulnerability
        sb.append(String.format("Location vulnerability score: %.0f. ", score.vulnerabilityScore()));

        // Fulfillment status
        BigDecimal required = item.getRequiredQty();
        BigDecimal fulfilled = (item.getFulfilledQty() != null ? item.getFulfilledQty() : BigDecimal.ZERO).add(allocated);
        if (fulfilled.compareTo(required) >= 0) {
            sb.append("This allocation fully satisfies the demand.");
        } else {
            BigDecimal unmet = required.subtract(fulfilled);
            sb.append(String.format("Partial fulfillment: %.2f %s still unmet after this allocation.", unmet, unit));
        }

        return sb.toString();
    }
}
