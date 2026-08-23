package com.drro.repository;

import com.drro.entity.AllocationFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AllocationFactorRepository extends JpaRepository<AllocationFactor, Long> {
    Optional<AllocationFactor> findByAllocation_AllocationId(Long allocationId);
}
