package com.drro.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Value
@Builder
public class WeightConfigResponse {
    Long configId;
    String configName;
    BigDecimal weightSeverity;
    BigDecimal weightPopulation;
    BigDecimal weightUrgency;
    BigDecimal weightShortage;
    BigDecimal weightTravel;
    BigDecimal weightVulnerability;
    Boolean active;
    OffsetDateTime createdAt;
}