package com.drro.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for a single Allocation record,
 * including its AllocationFactor (explanation) if present.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AllocationResponse {

    private Long allocationId;

    // ---- Request Item info ----
    private Long requestItemId;
    private Long requestId;
    private String resourceTypeName;
    private String unit;

    // ---- Source center info ----
    private Long centerId;
    private String centerName;

    // ---- Quantities ----
    private BigDecimal allocatedQty;
    private BigDecimal priorityScore;

    // ---- Status & lifecycle ----
    private String status;
    private OffsetDateTime recommendedAt;
    private Long approvedById;
    private String approvedByName;
    private OffsetDateTime approvedAt;
    private String notes;

    // ---- Explanation factors (from AllocationFactor) ----
    private BigDecimal severityScore;
    private BigDecimal populationScore;
    private BigDecimal urgencyScore;
    private BigDecimal shortageScore;
    private BigDecimal travelTimeScore;
    private BigDecimal vulnerabilityScore;
    private BigDecimal finalScore;
    private BigDecimal distanceKm;
    private BigDecimal estimatedTravelHrs;
    private String explanationText;
}
