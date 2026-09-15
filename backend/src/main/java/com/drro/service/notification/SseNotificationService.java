package com.drro.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class SseNotificationService {

    // Timeout: 30 minutes
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L;

    // All active emitters
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    // User-specific emitters map
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String username) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.add(emitter);
        if (username != null && !username.isBlank()) {
            userEmitters.computeIfAbsent(username, k -> new CopyOnWriteArrayList<>()).add(emitter);
        }

        emitter.onCompletion(() -> removeEmitter(emitter, username));
        emitter.onTimeout(() -> {
            emitter.complete();
            removeEmitter(emitter, username);
        });
        emitter.onError(e -> {
            log.debug("SSE emitter error for user {}: {}", username, e.getMessage());
            removeEmitter(emitter, username);
        });

        // Send initial connect handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Live event stream connected", "timestamp", System.currentTimeMillis()), MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            log.debug("Failed to send initial SSE connect event: {}", e.getMessage());
            removeEmitter(emitter, username);
        }

        return emitter;
    }

    public void broadcast(String eventName, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data, MediaType.APPLICATION_JSON));
            } catch (Exception e) {
                log.debug("Removing failed SSE emitter during broadcast: {}", e.getMessage());
                emitters.remove(emitter);
            }
        }
    }

    public void sendToUser(String username, String eventName, Object data) {
        if (username == null) {
            broadcast(eventName, data);
            return;
        }
        CopyOnWriteArrayList<SseEmitter> list = userEmitters.get(username);
        if (list != null) {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event()
                            .name(eventName)
                            .data(data, MediaType.APPLICATION_JSON));
                } catch (Exception e) {
                    removeEmitter(emitter, username);
                }
            }
        }
    }

    private void removeEmitter(SseEmitter emitter, String username) {
        emitters.remove(emitter);
        if (username != null) {
            CopyOnWriteArrayList<SseEmitter> list = userEmitters.get(username);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    userEmitters.remove(username);
                }
            }
        }
    }

    /**
     * Heartbeat ping every 25 seconds to keep connection alive through load balancers and proxies.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (emitters.isEmpty()) return;
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}
