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
import java.util.concurrent.atomic.AtomicReference;

/**
 * Scheduled web-scrape pipeline for external disaster feeds (GDACS, USGS).
 * Exposes last fetch status with source attribution and timestamps.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalDataFetchService {

    private final ExternalDataSyncService syncService;
    private final AtomicReference<Map<String, Object>> lastFetch = new AtomicReference<>(Map.of());

    @Value("${drro.external.enabled:true}")
    private boolean enabled;

    @Value("${drro.external.fetch-on-startup:true}")
    private boolean fetchOnStartup;

    @EventListener(ApplicationReadyEvent.class)
    public void fetchOnStartup() {
        if (enabled && fetchOnStartup) {
            fetch();
        }
    }

    @Scheduled(fixedDelayString = "${drro.external.fetch-interval-ms:3600000}")
    public void scheduledFetch() {
        if (enabled) {
            fetch();
        }
    }

    public Map<String, Object> fetch() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "WEB_SCRAPE");
        result.put("fetchedAt", OffsetDateTime.now());

        if (!enabled) {
            result.put("status", "DISABLED");
            result.put("message", "External web scraping is disabled (drro.external.enabled=false)");
            lastFetch.set(result);
            return result;
        }

        try {
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
        }

        lastFetch.set(result);
        return result;
    }

    public Map<String, Object> getLastFetchStatus() {
        Map<String, Object> status = new LinkedHashMap<>(lastFetch.get());
        status.putIfAbsent("mode", "WEB_SCRAPE");
        status.putIfAbsent("status", "NOT_RUN");
        return status;
    }
}
