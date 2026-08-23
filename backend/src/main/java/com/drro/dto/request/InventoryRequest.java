package com.drro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InventoryRequest {

    @NotNull(message = "Center ID is required")
    private Long centerId;

    @NotNull(message = "Resource Type ID is required")
    private Long resourceTypeId;

    @NotNull @DecimalMin("0.0")
    private BigDecimal availableQty;

    @DecimalMin("0.0")
    private BigDecimal minStockLevel;

    private LocalDate expiryDate;
}
