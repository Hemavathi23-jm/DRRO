package com.drro.repository;

import com.drro.entity.Notification;
import com.drro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.user IS NULL OR n.user = :user ORDER BY n.createdAt DESC")
    List<Notification> findByUserIsNullOrUserOrderByCreatedAtDesc(@Param("user") User user);

    long countByUser_UserIdAndReadFalse(Long userId);
}
