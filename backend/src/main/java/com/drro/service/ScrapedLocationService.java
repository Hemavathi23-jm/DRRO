package com.drro.service;

import com.drro.entity.Disaster;
import com.drro.entity.Location;
import com.drro.repository.LocationRepository;
import com.drro.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Creates an epicenter / impact-zone location for scraped disasters that have coordinates.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScrapedLocationService {

    private final LocationRepository locationRepository;
    private final HaversineUtil haversineUtil;

    /**
     * Ensures a primary affected location exists for the disaster.
     * @return true if a new location was created
     */
    public boolean ensureImpactLocation(Disaster disaster) {
        if (disaster.getLatitude() == null || disaster.getLongitude() == null) {
            return false;
        }

        List<Location> existing = locationRepository.findByDisaster_DisasterId(disaster.getDisasterId());
        double lat = disaster.getLatitude().doubleValue();
        double lon = disaster.getLongitude().doubleValue();

        boolean alreadyPresent = existing.stream().anyMatch(loc -> {
            if (loc.getLatitude() == null || loc.getLongitude() == null) return false;
            double dist = haversineUtil.distanceKm(
                    lat, lon,
                    loc.getLatitude().doubleValue(), loc.getLongitude().doubleValue());
            return dist < 5.0;
        });

        if (alreadyPresent) return false;

        String name = buildLocationName(disaster);
        int severity = disaster.getSeverity() != null ? disaster.getSeverity() : 50;
        int vulnerability = Math.min(100, Math.max(20, severity - 10));

        Location location = Location.builder()
                .disaster(disaster)
                .name(name)
                .latitude(disaster.getLatitude())
                .longitude(disaster.getLongitude())
                .populationAffected(estimatePopulation(severity))
                .vulnerabilityScore(vulnerability)
                .severityScore(severity)
                .accessibility(Location.AccessibilityType.ACCESSIBLE)
                .fulfillmentStatus(Location.FulfillmentStatus.PENDING)
                .openRequestCount(0)
                .notes(buildNotes(disaster))
                .build();

        locationRepository.save(location);
        log.info("[ExternalData] Auto-created location '{}' for disaster {}", name, disaster.getDisasterId());
        return true;
    }

    private static String buildLocationName(Disaster disaster) {
        String title = disaster.getTitle() != null ? disaster.getTitle().trim() : "Unknown event";
        if (title.length() > 120) title = title.substring(0, 117) + "...";
        String prefix = "Impact zone — ";
        String name = prefix + title;
        return name.length() <= 200 ? name : name.substring(0, 197) + "...";
    }

    private static String buildNotes(Disaster disaster) {
        StringBuilder sb = new StringBuilder();
        sb.append("Auto-created from web scrape");
        if (disaster.getExternalSource() != null) {
            sb.append(" (").append(disaster.getExternalSource()).append(")");
        }
        sb.append(". Coordinates taken from the reported event epicenter.");
        if (disaster.getSourceUrl() != null && !disaster.getSourceUrl().isBlank()) {
            sb.append(" Source: ").append(disaster.getSourceUrl());
        }
        return sb.toString();
    }

    private static int estimatePopulation(int severity) {
        if (severity >= 85) return 25000;
        if (severity >= 70) return 10000;
        if (severity >= 55) return 3000;
        return 500;
    }
}
