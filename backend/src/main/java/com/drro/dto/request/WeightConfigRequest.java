package com.drro.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WeightConfigRequest {
    @NotBlank
    private String configName;
    @NotNull @DecimalMin("0.00") @DecimalMax("1.00") private BigDecimal weightSeverity;
    @NotNull @DecimalMin("0.00") @DecimalMax("1.00") private BigDecimal weightPopulation;
    @NotNull @DecimalMin("0.00") @DecimalMax("1.00") private BigDecimal weightUrgency;
    @NotNull @DecimalMin("0.00") @DecimalMax("1.00") private BigDecimal weightShortage;
    @NotNull @DecimalMin("0.00") @DecimalMax("1.00") private BigDecimal weightTravel;
    @NotNull @DecimalMin("0.00") @DecimalMax("1.00") private BigDecimal weightVulnerability;
}