package com.drro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ResourceCenterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 200)
    private String name;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private BigDecimal latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private BigDecimal longitude;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String contact;

    private String status; // ACTIVE, INACTIVE
}
