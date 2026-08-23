package com.drro.repository;

import com.drro.entity.ResourceCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceCenterRepository extends JpaRepository<ResourceCenter, Long> {
    List<ResourceCenter> findByStatus(ResourceCenter.CenterStatus status);
}
