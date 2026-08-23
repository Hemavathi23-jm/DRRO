package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class InventoryResponse {
    private Long inventoryId;
    private Long centerId;
    private String centerName;
    private Long resourceTypeId;
    private String resourceTypeName;
    private String unit;
    private BigDecimal availableQty;
    private BigDecimal reservedQty;
    private BigDecimal dispatchedQty;
    private BigDecimal deliveredQty;
    private BigDecimal minStockLevel;
    private LocalDate expiryDate;
    private OffsetDateTime lastUpdated;
    private boolean belowMinStock;
}
