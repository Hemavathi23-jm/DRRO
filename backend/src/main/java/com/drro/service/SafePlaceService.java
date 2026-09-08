package com.drro.service;

import com.drro.dto.response.SafePlaceResponse;
import com.drro.entity.Location;
import com.drro.entity.ResourceCenter;
import com.drro.entity.ResourceType;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.InventoryRepository;
import com.drro.repository.LocationRepository;
import com.drro.repository.ResourceCenterRepository;
import com.drro.scraper.OsmSafePlaceScraper;
import com.drro.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Suggests nearby potential safe locations from internal shelters and OpenStreetMap.
 * Wording is informational — not verified safety guarantees.
 */
@Service
@RequiredArgsConstructor
public class SafePlaceService {

    private static final String DISCLAIMER =
            "Suggested nearby facility from public/open data — verify with authorities before use.";

    private final LocationRepository locationRepository;
    private final ResourceCenterRepository resourceCenterRepository;
    private final InventoryRepository inventoryRepository;
    private final HaversineUtil haversineUtil;
    private final OsmSafePlaceScraper osmSafePlaceScraper;

    @Transactional(readOnly = true)
    public List<SafePlaceResponse> suggestForLocation(Long locationId, double maxKm) {
        Location loc = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + locationId));

        double lat = loc.getLatitude().doubleValue();
        double lon = loc.getLongitude().doubleValue();
        List<SafePlaceResponse> results = new ArrayList<>();

        resourceCenterRepository.findAll().stream()
                .filter(rc -> rc.getStatus() == ResourceCenter.CenterStatus.ACTIVE)
                .filter(this::hasShelterCapacity)
                .forEach(rc -> {
                    double dist = haversineUtil.distanceKm(
                            lat, lon,
                            rc.getLatitude().doubleValue(), rc.getLongitude().doubleValue());
                    if (dist <= maxKm) {
                        results.add(SafePlaceResponse.builder()
                                .centerId(rc.getCenterId())
                                .name(rc.getName())
                                .latitude(rc.getLatitude())
                                .longitude(rc.getLongitude())
                                .address(rc.getAddress())
                                .distanceKm(round1(dist))
                                .type("Shelter / Resource Center")
                                .source("INTERNAL")
                                .disclaimer(DISCLAIMER)
                                .build());
                    }
                });

        if (osmSafePlaceScraper.isEnabled()) {
            for (OsmSafePlaceScraper.OsmPlace place : osmSafePlaceScraper.scrapeNear(lat, lon, maxKm)) {
                double dist = haversineUtil.distanceKm(
                        lat, lon,
                        place.latitude().doubleValue(), place.longitude().doubleValue());
                if (dist > maxKm) continue;
                results.add(SafePlaceResponse.builder()
                        .osmId(place.osmId())
                        .name(place.name())
                        .latitude(place.latitude())
                        .longitude(place.longitude())
                        .address(place.address())
                        .distanceKm(round1(dist))
                        .type(place.type())
                        .source("OSM")
                        .disclaimer(DISCLAIMER)
                        .build());
            }
        }

        return results.stream()
                .sorted(Comparator.comparingDouble(SafePlaceResponse::getDistanceKm))
                .limit(15)
                .toList();
    }

    private boolean hasShelterCapacity(ResourceCenter rc) {
        return inventoryRepository.findByCenterIdWithResourceType(rc.getCenterId()).stream()
                .anyMatch(inv -> inv.getResourceType().getCategory() == ResourceType.ResourceCategory.SHELTER
                        && inv.getAvailableQty().compareTo(java.math.BigDecimal.ZERO) > 0);
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
