package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    public enum NotificationType {
        DISASTER_CREATED,
        CRITICAL_REQUEST,
        LOW_INVENTORY,
        ALLOCATION_RECOMMENDED,
        ALLOCATION_APPROVED,
        DISPATCH,
        DELIVERY,
        SYSTEM
    }

    public enum NotificationSeverity {
        INFO, WARNING, CRITICAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NotificationSeverity severity = NotificationSeverity.INFO;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean read = false;

    @Column(name = "sms_status", length = 30)
    private String smsStatus;

    @Column(name = "created_at")
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
