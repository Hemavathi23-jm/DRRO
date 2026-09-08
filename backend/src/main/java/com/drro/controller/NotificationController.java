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

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(notificationService.getForUser(user.getUsername()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(Map.of("status", "read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(@AuthenticationPrincipal UserDetails user) {
        notificationService.markAllRead(user.getUsername());
        return ResponseEntity.ok(Map.of("status", "all_read"));
    }
}
