package com.drro.repository;

import com.drro.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {

    List<Allocation> findByStatus(Allocation.AllocationStatus status);

    List<Allocation> findByRequestItem_RequestItemId(Long requestItemId);

    List<Allocation> findByCenter_CenterId(Long centerId);

    List<Allocation> findByRequestItem_Request_RequestId(Long requestId);
}
