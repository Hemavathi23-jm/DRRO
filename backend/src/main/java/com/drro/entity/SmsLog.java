package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "sms_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sms_id")
    private Long smsId;

    @Column(name = "recipient_phone", nullable = false, length = 30)
    private String recipientPhone;

    @Column(name = "recipient_name", length = 100)
    private String recipientName;

    @Column(name = "recipient_role", length = 50)
    private String recipientRole; // ADMIN, TEAM_LEAD, FIELD_OFFICER, WAREHOUSE_MGR

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // ADMIN_CRITICAL_ALERT, DISPATCH, DELIVERY_POD, REQUEST_URGENT, STOCK_WARNING, TEST

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30)
    private String status; // DELIVERED, SENT, SIMULATED, FAILED

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    private String gatewayResponse;

    @Column(name = "sent_at")
    @Builder.Default
    private OffsetDateTime sentAt = OffsetDateTime.now();
}
