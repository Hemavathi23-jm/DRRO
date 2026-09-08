package com.drro.repository;

import com.drro.entity.Disaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisasterRepository extends JpaRepository<Disaster, Long> {

    @Query("SELECT d FROM Disaster d LEFT JOIN FETCH d.createdBy WHERE d.status = :status ORDER BY d.createdAt DESC")
    List<Disaster> findByStatusOrderByCreatedAtDesc(@Param("status") Disaster.DisasterStatus status);

    @Query("SELECT d FROM Disaster d LEFT JOIN FETCH d.createdBy ORDER BY d.createdAt DESC")
    List<Disaster> findAllOrderByCreatedAtDesc();

    @Query("SELECT d FROM Disaster d LEFT JOIN FETCH d.createdBy WHERE d.disasterId = :id")
    Optional<Disaster> findByIdWithUser(@Param("id") Long id);

    Optional<Disaster> findByExternalSourceAndExternalId(String externalSource, String externalId);
}
