package com.drro.dto.response;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsSendResponse {
    private Long smsId;
    private String recipientPhone;
    private String recipientName;
    private String recipientRole;
    private String eventType;
    private String message;
    private String status; // DELIVERED, SENT, SIMULATED, FAILED
    private String gatewayResponse;
    private OffsetDateTime sentAt;
}
