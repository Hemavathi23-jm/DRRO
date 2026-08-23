package com.drro.repository;

import com.drro.entity.Dispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Long> {
    List<Dispatch> findByAllocation_AllocationId(Long allocationId);
    List<Dispatch> findByStatus(Dispatch.DispatchStatus status);
}
