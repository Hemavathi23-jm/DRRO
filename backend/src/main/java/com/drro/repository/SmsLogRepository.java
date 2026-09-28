package com.drro.repository;

import com.drro.entity.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmsLogRepository extends JpaRepository<SmsLog, Long> {
    List<SmsLog> findAllByOrderBySentAtDesc();
    List<SmsLog> findTop50ByOrderBySentAtDesc();
}
