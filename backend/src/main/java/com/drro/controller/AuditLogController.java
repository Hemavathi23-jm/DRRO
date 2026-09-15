package com.drro.controller;

import com.drro.dto.response.AuditLogResponse;
import com.drro.service.AuditLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAll(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) Long entityId) {
        if (userId != null) {
            return ResponseEntity.ok(auditLogService.getByUser(userId));
        }
        if (entity != null && entityId != null) {
            return ResponseEntity.ok(auditLogService.getByEntity(entity, entityId));
        }
        return ResponseEntity.ok(auditLogService.getAll());
    }
}
