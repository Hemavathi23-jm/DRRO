package com.drro.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for a Dispatch record.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DispatchResponse {

    private Long dispatchId;

    // ---- Allocation info ----
    private Long allocationId;
    private Long requestItemId;
    private Long requestId;
    private String resourceTypeName;
    private String unit;
    private BigDecimal allocatedQty;

    // ---- Source / destination ----
    private Long centerId;
    private String centerName;
    private String locationName;

    // ---- Team ----
    private Long teamId;
    private String teamName;

    // ---- Dispatch details ----
    private String vehicleInfo;
    private OffsetDateTime dispatchedAt;
    private OffsetDateTime estimatedArrival;
    private OffsetDateTime actualArrival;
    private BigDecimal deliveredQty;
    private String status;

    // ---- Audit ----
    private Long createdById;
    private String createdByName;
    private String notes;
}
