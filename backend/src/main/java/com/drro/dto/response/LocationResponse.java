package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class LocationResponse {
    private Long locationId;
    private Long disasterId;
    private String disasterTitle;
    private String name;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer populationAffected;
    private Integer vulnerabilityScore;
    private Integer severityScore;
    private String accessibility;
    private Integer openRequestCount;
    private String fulfillmentStatus;
    private String notes;
    private OffsetDateTime createdAt;
}
