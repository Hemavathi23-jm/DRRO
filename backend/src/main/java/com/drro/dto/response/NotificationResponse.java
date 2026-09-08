package com.drro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long notificationId;
    private String type;
    private String severity;
    private String title;
    private String message;
    private String entityType;
    private Long entityId;
    private String actionUrl;
    private Boolean read;
    private String smsStatus;
    private OffsetDateTime createdAt;
}
