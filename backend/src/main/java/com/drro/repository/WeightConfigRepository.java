package com.drro.repository;

import com.drro.entity.WeightConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeightConfigRepository extends JpaRepository<WeightConfig, Long> {
    Optional<WeightConfig> findByIsActiveTrue();
}
