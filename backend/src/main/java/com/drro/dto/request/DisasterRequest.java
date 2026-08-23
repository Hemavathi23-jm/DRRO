package com.drro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class DisasterRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @NotNull(message = "Disaster type is required")
    private String type;

    @NotNull
    @Min(1) @Max(100)
    private Integer severity;

    @NotNull(message = "Start time is required")
    private OffsetDateTime startTime;

    private OffsetDateTime endTime;

    @DecimalMin("-90.0") @DecimalMax("90.0")
    private BigDecimal latitude;

    @DecimalMin("-180.0") @DecimalMax("180.0")
    private BigDecimal longitude;

    private String description;

    private String status;
}
