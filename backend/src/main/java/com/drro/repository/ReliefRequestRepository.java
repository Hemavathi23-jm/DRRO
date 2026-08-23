package com.drro.repository;

import com.drro.entity.ReliefRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReliefRequestRepository extends JpaRepository<ReliefRequest, Long> {

    List<ReliefRequest> findByDisaster_DisasterIdOrderByCreatedAtDesc(Long disasterId);

    List<ReliefRequest> findByStatus(ReliefRequest.RequestStatus status);

    List<ReliefRequest> findByLocation_LocationId(Long locationId);
}
