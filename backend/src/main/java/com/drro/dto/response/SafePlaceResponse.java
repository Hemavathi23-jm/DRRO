package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SafePlaceResponse {
    private Long centerId;
    private String osmId;
    private String name;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private Double distanceKm;
    private String type;
    private String source;
    private String disclaimer;
}
