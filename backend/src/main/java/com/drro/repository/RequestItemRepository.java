package com.drro.repository;

import com.drro.entity.RequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestItemRepository extends JpaRepository<RequestItem, Long> {

    List<RequestItem> findByRequest_RequestId(Long requestId);

    List<RequestItem> findByStatus(RequestItem.ItemStatus status);

    @Query("SELECT i FROM RequestItem i " +
           "JOIN FETCH i.request r " +
           "JOIN FETCH r.location l " +
           "JOIN FETCH i.resourceType rt " +
           "WHERE i.status = :openStatus OR i.status = :partialStatus")
    List<RequestItem> findByStatusInWithDetails(
            @Param("openStatus") RequestItem.ItemStatus openStatus,
            @Param("partialStatus") RequestItem.ItemStatus partialStatus);
}
