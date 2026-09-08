package com.drro.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Request DTO for creating a new Dispatch record from an APPROVED allocation.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DispatchRequest {

    /** ID of the APPROVED allocation being dispatched */
    private Long allocationId;

    /** Optional response team assigned to this dispatch */
    private Long teamId;

    /** Vehicle details e.g. "Truck TN-01-AB-1234" */
    private String vehicleInfo;

    /** Estimated arrival at the affected location */
    private OffsetDateTime estimatedArrival;

    /** Optional notes */
    private String notes;
}
