package com.drro.repository;

import com.drro.entity.TeamAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamAssignmentRepository extends JpaRepository<TeamAssignment, Long> {
    List<TeamAssignment> findByTeam_TeamId(Long teamId);
    List<TeamAssignment> findByDisaster_DisasterId(Long disasterId);
}
