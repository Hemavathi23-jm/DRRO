package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResourceTypeResponse {
    private Long resourceTypeId;
    private String name;
    private String unit;
    private String category;
    private Boolean perishable;
    private String description;
}
