package com.drro.dto.request;

import lombok.*;

/**
 * Request DTO for officer to approve / reject / modify an allocation.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AllocationDecisionRequest {

    /**
     * Decision: APPROVED, REJECTED, or MODIFIED.
     */
    private String decision;

    /**
     * Optional: override quantity (only used when decision = MODIFIED).
     */
    private java.math.BigDecimal overrideQty;

    /**
     * Optional notes from the officer.
     */
    private String notes;
}
