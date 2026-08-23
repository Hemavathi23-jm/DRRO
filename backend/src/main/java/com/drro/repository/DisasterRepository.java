package com.drro.repository;

import com.drro.entity.Disaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisasterRepository extends JpaRepository<Disaster, Long> {

    List<Disaster> findByStatusOrderByCreatedAtDesc(Disaster.DisasterStatus status);

    @Query("SELECT d FROM Disaster d ORDER BY d.createdAt DESC")
    List<Disaster> findAllOrderByCreatedAtDesc();
}
