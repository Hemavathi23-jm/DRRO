package com.drro.repository;

import com.drro.entity.RequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestItemRepository extends JpaRepository<RequestItem, Long> {

    List<RequestItem> findByRequest_RequestId(Long requestId);

    List<RequestItem> findByStatus(RequestItem.ItemStatus status);
}
