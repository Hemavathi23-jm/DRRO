package com.drro.service;

import com.drro.dto.response.AuditLogResponse;
import com.drro.entity.AuditLog;
import com.drro.entity.User;
import com.drro.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void record(User actor, String action, String entity, Long entityId,
                       String oldValue, String newValue) {
        auditLogRepository.save(AuditLog.builder()
                .user(actor)
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .build());
    }

    public List<AuditLogResponse> getAll() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AuditLogResponse> getByUser(Long userId) {
        return auditLogRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AuditLogResponse> getByEntity(String entity, Long entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .logId(a.getLogId())
                .userId(a.getUser() != null ? a.getUser().getUserId() : null)
                .username(a.getUser() != null ? (a.getUser().getName() != null ? a.getUser().getName() : a.getUser().getEmail()) : "System")
                .userRole(a.getUser() != null && a.getUser().getRole() != null ? a.getUser().getRole().getRoleName() : "SYSTEM")
                .action(a.getAction())
                .entity(a.getEntity())
                .entityId(a.getEntityId())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt())
                .build();
    }
}