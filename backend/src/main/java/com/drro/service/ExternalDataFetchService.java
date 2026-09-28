package com.drro.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Continuous web-scrape pipeline for external disaster feeds
 * (GDACS, USGS, NASA EONET, ReliefWeb).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalDataFetchService {

    private final ExternalDataSyncService syncService;
    private final AtomicReference<Map<String, Object>> lastFetch = new AtomicReference<>(Map.of());
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Value("${drro.external.enabled:true}")
    private boolean enabled;

    @Value("${drro.external.fetch-on-startup:true}")
    private boolean fetchOnStartup;

    @Value("${drro.external.fetch-interval-ms:300000}")
    private long fetchIntervalMs;

    @EventListener(ApplicationReadyEvent.class)
    public void fetchOnStartup() {
        if (enabled && fetchOnStartup) {
            log.info("[ExternalData] Startup sync — continuous interval={}ms", fetchIntervalMs);
            fetch();
        }
    }

    /** Runs after each completed sync, then waits {@code fetch-interval-ms} before the next. */
    @Scheduled(
            fixedDelayString = "${drro.external.fetch-interval-ms:300000}",
            initialDelayString = "${drro.external.fetch-interval-ms:300000}"
    )
    public void scheduledFetch() {
        if (enabled) {
            log.debug("[ExternalData] Scheduled continuous sync starting");
            fetch();
        }
    }

    public Map<String, Object> fetch() {
        if (!running.compareAndSet(false, true)) {
            Map<String, Object> busy = new LinkedHashMap<>(lastFetch.get());
            busy.put("mode", "WEB_SCRAPE");
            busy.put("status", "IN_PROGRESS");
            busy.put("message", "A live sync is already running");
            busy.put("autoFetchEnabled", enabled);
            busy.put("fetchIntervalMs", fetchIntervalMs);
            return busy;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "WEB_SCRAPE");
        result.put("fetchedAt", OffsetDateTime.now());
        result.put("autoFetchEnabled", enabled);
        result.put("fetchIntervalMs", fetchIntervalMs);

        try {
            if (!enabled) {
                result.put("status", "DISABLED");
                result.put("message", "External web scraping is disabled (drro.external.enabled=false)");
                lastFetch.set(result);
                return result;
            }

            Map<String, Object> syncSummary = syncService.syncAll();
            result.put("status", "SUCCESS");
            result.put("message", "Disaster data synced from public web feeds");
            result.putAll(syncSummary);
            log.info("[ExternalData] Web scrape completed — created={}, updated={}",
                    syncSummary.get("recordsCreated"), syncSummary.get("recordsUpdated"));
        } catch (Exception e) {
            log.error("[ExternalData] Web scrape failed: {}", e.getMessage(), e);
            result.put("status", "FAILED");
            result.put("message", e.getMessage());
            result.put("recordsUpdated", 0);
        } finally {
            running.set(false);
        }

        lastFetch.set(result);
        return result;
    }

    public Map<String, Object> getLastFetchStatus() {
        Map<String, Object> status = new LinkedHashMap<>(lastFetch.get());
        status.putIfAbsent("mode", "WEB_SCRAPE");
        status.putIfAbsent("status", "NOT_RUN");
        status.put("autoFetchEnabled", enabled);
        status.put("fetchIntervalMs", fetchIntervalMs);
        status.put("running", running.get());
        return status;
    }
}
