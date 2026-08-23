package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class DisasterResponse {
    private Long disasterId;
    private String title;
    private String type;
    private Integer severity;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String description;
    private String status;
    private Long createdById;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
