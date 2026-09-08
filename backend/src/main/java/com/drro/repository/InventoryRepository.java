package com.drro.repository;

import com.drro.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findByCenter_CenterId(Long centerId);

    Optional<Inventory> findByCenter_CenterIdAndResourceType_ResourceTypeId(Long centerId, Long resourceTypeId);

    @Query("SELECT i FROM Inventory i WHERE i.resourceType.resourceTypeId = :typeId AND i.availableQty > 0")
    List<Inventory> findAvailableByResourceType(@Param("typeId") Long typeId);

    @Query("SELECT i FROM Inventory i JOIN FETCH i.center LEFT JOIN FETCH i.resourceType")
    List<Inventory> findAllWithCenterAndType();

    @Query("SELECT i FROM Inventory i JOIN FETCH i.center JOIN FETCH i.resourceType WHERE i.center.centerId = :centerId")
    List<Inventory> findByCenterIdWithResourceType(@Param("centerId") Long centerId);
}
