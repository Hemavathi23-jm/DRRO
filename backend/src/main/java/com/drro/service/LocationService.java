package com.drro.service;

import com.drro.dto.request.LocationRequest;
import com.drro.dto.response.LocationResponse;
import com.drro.entity.Disaster;
import com.drro.entity.Location;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.DisasterRepository;
import com.drro.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final DisasterRepository disasterRepository;

    /** Get all locations for a specific disaster */
    public List<LocationResponse> getByDisaster(Long disasterId) {
        findDisasterOrThrow(disasterId);
        return locationRepository.findByDisaster_DisasterId(disasterId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Get single location by ID */
    public LocationResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    /** Create a new affected location under a disaster */
    @Transactional
    public LocationResponse create(LocationRequest req) {
        Disaster disaster = findDisasterOrThrow(req.getDisasterId());

        Location location = Location.builder()
                .disaster(disaster)
                .name(req.getName())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .populationAffected(req.getPopulationAffected() != null ? req.getPopulationAffected() : 0)
                .vulnerabilityScore(req.getVulnerabilityScore() != null ? req.getVulnerabilityScore() : 0)
                .severityScore(req.getSeverityScore() != null ? req.getSeverityScore() : 0)
                .accessibility(req.getAccessibility() != null
                        ? Location.AccessibilityType.valueOf(req.getAccessibility().toUpperCase())
                        : Location.AccessibilityType.ACCESSIBLE)
                .notes(req.getNotes())
                .build();

        return toResponse(locationRepository.save(location));
    }

    /** Update an existing location */
    @Transactional
    public LocationResponse update(Long id, LocationRequest req) {
        Location location = findOrThrow(id);

        location.setName(req.getName());
        location.setLatitude(req.getLatitude());
        location.setLongitude(req.getLongitude());
        if (req.getPopulationAffected() != null)
            location.setPopulationAffected(req.getPopulationAffected());
        if (req.getVulnerabilityScore() != null)
            location.setVulnerabilityScore(req.getVulnerabilityScore());
        if (req.getSeverityScore() != null)
            location.setSeverityScore(req.getSeverityScore());
        if (req.getAccessibility() != null)
            location.setAccessibility(
                    Location.AccessibilityType.valueOf(req.getAccessibility().toUpperCase()));
        if (req.getNotes() != null)
            location.setNotes(req.getNotes());

        return toResponse(locationRepository.save(location));
    }

    /** Delete a location */
    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        locationRepository.deleteById(id);
    }

    // ---- helpers ---------------------------------------------------------------

    private Location findOrThrow(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + id));
    }

    private Disaster findDisasterOrThrow(Long disasterId) {
        return disasterRepository.findById(disasterId)
                .orElseThrow(() -> new ResourceNotFoundException("Disaster not found: " + disasterId));
    }

    private LocationResponse toResponse(Location l) {
        return LocationResponse.builder()
                .locationId(l.getLocationId())
                .disasterId(l.getDisaster().getDisasterId())
                .disasterTitle(l.getDisaster().getTitle())
                .name(l.getName())
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .populationAffected(l.getPopulationAffected())
                .vulnerabilityScore(l.getVulnerabilityScore())
                .severityScore(l.getSeverityScore())
                .accessibility(l.getAccessibility() != null ? l.getAccessibility().name() : null)
                .openRequestCount(l.getOpenRequestCount())
                .fulfillmentStatus(l.getFulfillmentStatus() != null ? l.getFulfillmentStatus().name() : null)
                .notes(l.getNotes())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
