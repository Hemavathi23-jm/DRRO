package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class ReliefRequestResponse {
    private Long requestId;
    private Long disasterId;
    private String disasterTitle;
    private Long locationId;
    private String locationName;
    private String urgency;
    private OffsetDateTime deadline;
    private String status;
    private Long createdById;
    private String createdByName;
    private Long verifiedById;
    private String verifiedByName;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<RequestItemResponse> items;

    @Data
    @Builder
    public static class RequestItemResponse {
        private Long requestItemId;
        private Long resourceTypeId;
        private String resourceTypeName;
        private String unit;
        private BigDecimal requiredQty;
        private BigDecimal fulfilledQty;
        private BigDecimal unmetQty;
        private BigDecimal priorityScore;
        private String status;
    }
}
