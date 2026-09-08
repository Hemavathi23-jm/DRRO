package com.drro.service;

import com.drro.entity.AuditLog;
import com.drro.entity.User;
import com.drro.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

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
}