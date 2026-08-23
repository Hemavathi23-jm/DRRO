package com.drro.repository;

import com.drro.entity.ResponseTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResponseTeamRepository extends JpaRepository<ResponseTeam, Long> {
    List<ResponseTeam> findByAvailability(ResponseTeam.TeamAvailability availability);
}
