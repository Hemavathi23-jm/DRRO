package com.drro.service;

import com.drro.entity.Disaster;
import com.drro.repository.DisasterRepository;
import com.drro.scraper.DisasterWebScraper;
import com.drro.scraper.ScrapedDisasterRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ExternalDataSyncService {

    private final List<DisasterWebScraper> scrapers;
    private final DisasterRepository disasterRepository;
    private final ScrapedLocationService scrapedLocationService;
    private final TransactionTemplate transactionTemplate;

    public ExternalDataSyncService(
            List<DisasterWebScraper> scrapers,
            DisasterRepository disasterRepository,
            ScrapedLocationService scrapedLocationService,
            PlatformTransactionManager transactionManager) {
        this.scrapers = scrapers;
        this.disasterRepository = disasterRepository;
        this.scrapedLocationService = scrapedLocationService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public Map<String, Object> syncAll() {
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int locationsCreated = 0;
        List<Map<String, Object>> sourceResults = new ArrayList<>();

        for (DisasterWebScraper scraper : scrapers) {
            Map<String, Object> sourceResult = new LinkedHashMap<>();
            sourceResult.put("source", scraper.sourceName());
            try {
                List<ScrapedDisasterRecord> records = scraper.scrape();
                int sourceCreated = 0;
                int sourceUpdated = 0;
                int sourceSkipped = 0;
                int sourceLocations = 0;

                for (ScrapedDisasterRecord record : records) {
                    SyncResult result = transactionTemplate.execute(status -> {
                        try {
                            return upsert(record);
                        } catch (Exception e) {
                            status.setRollbackOnly();
                            throw e;
                        }
                    });
                    if (result == null) continue;
                    switch (result.outcome()) {
                        case CREATED -> sourceCreated++;
                        case UPDATED -> sourceUpdated++;
                        case SKIPPED -> sourceSkipped++;
                    }
                    if (result.locationCreated()) sourceLocations++;
                }

                created += sourceCreated;
                updated += sourceUpdated;
                skipped += sourceSkipped;
                locationsCreated += sourceLocations;
                sourceResult.put("status", "SUCCESS");
                sourceResult.put("recordsFound", records.size());
                sourceResult.put("created", sourceCreated);
                sourceResult.put("updated", sourceUpdated);
                sourceResult.put("locationsCreated", sourceLocations);
            } catch (Exception e) {
                log.error("[ExternalData] Scraper {} failed: {}", scraper.sourceName(), e.getMessage());
                sourceResult.put("status", "FAILED");
                sourceResult.put("error", e.getMessage());
            }
            sourceResults.add(sourceResult);
        }

        // Backfill impact locations for existing scraped disasters that still lack one
        Integer backfilled = transactionTemplate.execute(status -> {
            int count = 0;
            for (Disaster d : disasterRepository.findAll()) {
                if (d.getExternalSource() != null
                        && d.getLatitude() != null
                        && d.getLongitude() != null
                        && scrapedLocationService.ensureImpactLocation(d)) {
                    count++;
                }
            }
            return count;
        });
        if (backfilled != null) locationsCreated += backfilled;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("recordsCreated", created);
        summary.put("recordsUpdated", updated);
        summary.put("recordsSkipped", skipped);
        summary.put("locationsCreated", locationsCreated);
        summary.put("sources", sourceResults);
        return summary;
    }

    private SyncResult upsert(ScrapedDisasterRecord record) {
        var existing = disasterRepository.findByExternalSourceAndExternalId(
                record.getSource(), record.getExternalId());

        if (existing.isPresent()) {
            Disaster disaster = existing.get();
            disaster.setTitle(record.getTitle());
            disaster.setType(record.getType());
            disaster.setSeverity(record.getSeverity());
            disaster.setStartTime(record.getStartTime());
            disaster.setLatitude(record.getLatitude());
            disaster.setLongitude(record.getLongitude());
            disaster.setDescription(record.getDescription());
            disaster.setSourceUrl(record.getSourceUrl());
            if (!record.isActive()) {
                disaster.setStatus(Disaster.DisasterStatus.CONTAINED);
            } else if (disaster.getStatus() == Disaster.DisasterStatus.CLOSED) {
                return new SyncResult(SyncOutcome.SKIPPED, false);
            } else {
                disaster.setStatus(Disaster.DisasterStatus.ACTIVE);
            }
            disasterRepository.save(disaster);
            boolean locCreated = scrapedLocationService.ensureImpactLocation(disaster);
            return new SyncResult(SyncOutcome.UPDATED, locCreated);
        }

        Disaster disaster = Disaster.builder()
                .title(record.getTitle())
                .type(record.getType())
                .severity(record.getSeverity())
                .startTime(record.getStartTime())
                .latitude(record.getLatitude())
                .longitude(record.getLongitude())
                .description(record.getDescription())
                .sourceUrl(record.getSourceUrl())
                .externalSource(record.getSource())
                .externalId(record.getExternalId())
                .status(record.isActive() ? Disaster.DisasterStatus.ACTIVE : Disaster.DisasterStatus.CONTAINED)
                .build();
        disasterRepository.save(disaster);
        boolean locCreated = scrapedLocationService.ensureImpactLocation(disaster);
        return new SyncResult(SyncOutcome.CREATED, locCreated);
    }

    private enum SyncOutcome { CREATED, UPDATED, SKIPPED }

    private record SyncResult(SyncOutcome outcome, boolean locationCreated) {}
}
