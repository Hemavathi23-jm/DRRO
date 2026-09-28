package com.drro.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsSendRequest {

    @NotBlank(message = "Phone number is required")
    private String recipientPhone;

    private String recipientName;
    private String recipientRole; // ADMIN, TEAM_LEAD, FIELD_OFFICER, WAREHOUSE_MGR
    private String eventType;     // ADMIN_CRITICAL_ALERT, DISPATCH, DELIVERY_POD, REQUEST_URGENT, STOCK_WARNING, TEST

    @NotBlank(message = "Message text is required")
    private String message;
}
