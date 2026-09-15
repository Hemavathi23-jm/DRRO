package com.drro.controller;

import com.drro.dto.response.NotificationResponse;
import com.drro.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final com.drro.service.notification.SseNotificationService sseNotificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal UserDetails user) {
        String username = user != null ? user.getUsername() : "admin@drro.com";
        return ResponseEntity.ok(notificationService.getForUser(username));
    }

    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter stream(
            @AuthenticationPrincipal UserDetails user) {
        String username = user != null ? user.getUsername() : null;
        return sseNotificationService.subscribe(username);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(Map.of("status", "read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(@AuthenticationPrincipal UserDetails user) {
        String username = user != null ? user.getUsername() : "admin@drro.com";
        notificationService.markAllRead(username);
        return ResponseEntity.ok(Map.of("status", "all_read"));
    }
}
