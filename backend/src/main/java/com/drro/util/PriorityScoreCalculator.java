package com.drro.util;

import com.drro.entity.*;
import com.drro.repository.WeightConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculates a composite priority score (0-100) for a RequestItem
 * using configurable weights stored in weight_config.
 *
 * Score = w1*severity + w2*population + w3*urgency + w4*shortage + w5*travel + w6*vulnerability
 *
 * Each sub-score is normalised to 0-100 before weighting.
 */
@Component
@RequiredArgsConstructor
public class PriorityScoreCalculator {

    private final WeightConfigRepository weightConfigRepo;
    private final HaversineUtil haversineUtil;

    // Maximum population used for normalisation
    private static final double MAX_POPULATION = 500_000.0;

    public ScoreBreakdown calculate(RequestItem item, ResourceCenter center) {
        WeightConfig weights = weightConfigRepo.findByIsActiveTrue()
                .orElseGet(this::defaultWeights);

        Location loc  = item.getRequest().getLocation();
        Disaster dis  = item.getRequest().getDisaster();

        // ---- Sub-scores (0-100) -----------------------------------------------
        double severity     = clamp(dis.getSeverity(), 0, 100);

        double population   = normalize(
                loc.getPopulationAffected() == null ? 0 : loc.getPopulationAffected(),
                MAX_POPULATION);

        double urgency      = urgencyScore(item.getRequest().getUrgency());

        double shortage     = shortageScore(item);

        double distKm       = haversineUtil.distanceKm(
                loc.getLatitude().doubleValue(),  loc.getLongitude().doubleValue(),
                center.getLatitude().doubleValue(), center.getLongitude().doubleValue());
        // Closer = better: invert so 0 km → 100, 500+ km → 0
        double travel       = clamp(100.0 - (distKm / 5.0), 0, 100);

        double vulnerability = clamp(
                loc.getVulnerabilityScore() == null ? 0 : loc.getVulnerabilityScore(), 0, 100);

        // ---- Weighted final score -----------------------------------------------
        double w1 = weights.getWeightSeverity().doubleValue();
        double w2 = weights.getWeightPopulation().doubleValue();
        double w3 = weights.getWeightUrgency().doubleValue();
        double w4 = weights.getWeightShortage().doubleValue();
        double w5 = weights.getWeightTravel().doubleValue();
        double w6 = weights.getWeightVulnerability().doubleValue();

        double finalScore = w1 * severity
                + w2 * population
                + w3 * urgency
                + w4 * shortage
                + w5 * travel
                + w6 * vulnerability;

        return new ScoreBreakdown(
                round(severity), round(population), round(urgency),
                round(shortage), round(travel), round(vulnerability),
                round(finalScore), round(distKm),
                round(haversineUtil.estimatedTravelHours(distKm)));
    }

    // ---- helpers ---------------------------------------------------------------

    private double urgencyScore(ReliefRequest.UrgencyLevel level) {
        return switch (level) {
            case LOW      -> 25.0;
            case MEDIUM   -> 50.0;
            case HIGH     -> 75.0;
            case CRITICAL -> 100.0;
        };
    }

    private double shortageScore(RequestItem item) {
        if (item.getRequiredQty() == null || item.getRequiredQty().compareTo(BigDecimal.ZERO) == 0)
            return 0;
        BigDecimal unmet = item.getUnmetQty() != null
                ? item.getUnmetQty()
                : item.getRequiredQty().subtract(
                        item.getFulfilledQty() != null ? item.getFulfilledQty() : BigDecimal.ZERO);
        double ratio = unmet.doubleValue() / item.getRequiredQty().doubleValue();
        return clamp(ratio * 100.0, 0, 100);
    }

    private double normalize(double value, double max) {
        return max == 0 ? 0 : clamp((value / max) * 100.0, 0, 100);
    }

    private double clamp(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    private BigDecimal round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
    }

    private WeightConfig defaultWeights() {
        WeightConfig w = new WeightConfig();
        w.setWeightSeverity(new BigDecimal("0.25"));
        w.setWeightPopulation(new BigDecimal("0.20"));
        w.setWeightUrgency(new BigDecimal("0.20"));
        w.setWeightShortage(new BigDecimal("0.20"));
        w.setWeightTravel(new BigDecimal("0.10"));
        w.setWeightVulnerability(new BigDecimal("0.05"));
        return w;
    }

    // ---- Inner record for score breakdown --------------------------------------

    public record ScoreBreakdown(
            BigDecimal severityScore,
            BigDecimal populationScore,
            BigDecimal urgencyScore,
            BigDecimal shortageScore,
            BigDecimal travelTimeScore,
            BigDecimal vulnerabilityScore,
            BigDecimal finalScore,
            BigDecimal distanceKm,
            BigDecimal estimatedTravelHrs
    ) {}
}
