package com.drro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class ReliefRequestRequest {

    @NotNull(message = "Disaster ID is required")
    private Long disasterId;

    @NotNull(message = "Location ID is required")
    private Long locationId;

    @NotBlank(message = "Urgency is required")
    private String urgency; // LOW, MEDIUM, HIGH, CRITICAL

    private OffsetDateTime deadline;

    private String notes;

    @NotEmpty(message = "At least one item is required")
    private List<RequestItemDto> items;

    @Data
    public static class RequestItemDto {
        @NotNull
        private Long resourceTypeId;

        @NotNull @DecimalMin("0.01")
        private BigDecimal requiredQty;
    }
}
