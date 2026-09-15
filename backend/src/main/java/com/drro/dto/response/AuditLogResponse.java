package com.drro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long logId;
    private Long userId;
    private String username;
    private String userRole;
    private String action;
    private String entity;
    private Long entityId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private OffsetDateTime createdAt;
}
