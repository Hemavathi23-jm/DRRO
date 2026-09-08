package com.drro.service;

import com.drro.dto.response.NotificationResponse;
import com.drro.entity.Notification;
import com.drro.entity.User;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.NotificationRepository;
import com.drro.repository.UserRepository;
import com.drro.service.notification.SmsNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SmsNotificationService smsNotificationService;

    @Transactional
    public NotificationResponse create(Notification.NotificationType type,
                                       Notification.NotificationSeverity severity,
                                       String title,
                                       String message,
                                       String entityType,
                                       Long entityId,
                                       String actionUrl,
                                       User targetUser,
                                       boolean attemptSms) {
        String smsStatus = null;
        if (attemptSms && targetUser != null && targetUser.getEmail() != null) {
            SmsNotificationService.SmsResult result =
                    smsNotificationService.send(targetUser.getEmail(), message);
            smsStatus = result.name();
        }

        Notification n = Notification.builder()
                .type(type)
                .severity(severity)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .actionUrl(actionUrl)
                .user(targetUser)
                .smsStatus(smsStatus)
                .build();

        return toResponse(notificationRepository.save(n));
    }

    public void notifyOfficers(Notification.NotificationType type,
                               Notification.NotificationSeverity severity,
                               String title,
                               String message,
                               String entityType,
                               Long entityId,
                               String actionUrl) {
        List<User> officers = userRepository.findByRole_RoleName("OFFICER");
        for (User officer : officers) {
            create(type, severity, title, message, entityType, entityId, actionUrl, officer, true);
        }
        create(type, severity, title, message, entityType, entityId, actionUrl, null, false);
    }

    public List<NotificationResponse> getForUser(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        return notificationRepository.findByUserIsNullOrUserOrderByCreatedAtDesc(user)
                .stream().limit(20).map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void markRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        notificationRepository.findByUserIsNullOrUserOrderByCreatedAtDesc(user)
                .forEach(n -> n.setRead(true));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .type(n.getType().name())
                .severity(n.getSeverity().name())
                .title(n.getTitle())
                .message(n.getMessage())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .actionUrl(n.getActionUrl())
                .read(n.getRead())
                .smsStatus(n.getSmsStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
