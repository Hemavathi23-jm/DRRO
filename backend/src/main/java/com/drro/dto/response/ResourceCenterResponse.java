package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class ResourceCenterResponse {
    private Long centerId;
    private String name;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String contact;
    private String status;
    private OffsetDateTime createdAt;
}
