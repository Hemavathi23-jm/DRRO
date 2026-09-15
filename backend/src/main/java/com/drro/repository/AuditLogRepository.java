package com.drro.repository;

import com.drro.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByCreatedAtDesc();
    List<AuditLog> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
    List<AuditLog> findByEntityAndEntityIdOrderByCreatedAtDesc(String entity, Long entityId);
}
