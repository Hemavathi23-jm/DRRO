package com.drro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LocationRequest {

    @NotNull(message = "Disaster ID is required")
    private Long disasterId;

    @NotBlank(message = "Location name is required")
    @Size(max = 200)
    private String name;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private BigDecimal latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private BigDecimal longitude;

    @Min(0)
    private Integer populationAffected;

    @Min(0) @Max(100)
    private Integer vulnerabilityScore;

    @Min(0) @Max(100)
    private Integer severityScore;

    private String accessibility; // ACCESSIBLE, DIFFICULT, BLOCKED

    private String notes;
}
