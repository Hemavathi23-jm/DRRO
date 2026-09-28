package com.drro.service;

import com.drro.entity.*;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MapDataService {

    private final DisasterRepository disasterRepository;
    private final LocationRepository locationRepository;
    private final ResourceCenterRepository resourceCenterRepository;
    private final ResponseTeamRepository responseTeamRepository;
    private final DispatchRepository dispatchRepository;
    private final TeamAssignmentRepository teamAssignmentRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getOperationalMapData() {
        Map<String, Object> data = new LinkedHashMap<>();

        data.put("disasters", disasterRepository.findAll().stream()
                .filter(d -> d.getStatus() == Disaster.DisasterStatus.ACTIVE)
                .map(d -> marker("disaster", d.getDisasterId(), d.getTitle(),
                        d.getLatitude(), d.getLongitude(), d.getSeverity(), d.getType().name()))
                .collect(Collectors.toList()));

        data.put("locations", locationRepository.findAll().stream()
                .map(l -> {
                    Map<String, Object> m = marker("location", l.getLocationId(), l.getName(),
                            l.getLatitude(), l.getLongitude(), l.getSeverityScore(), null);
                    m.put("populationAffected", l.getPopulationAffected());
                    m.put("vulnerabilityScore", l.getVulnerabilityScore());
                    m.put("accessibility", l.getAccessibility().name());
                    m.put("disasterId", l.getDisaster().getDisasterId());
                    m.put("openRequestCount", l.getOpenRequestCount());
                    return m;
                }).collect(Collectors.toList()));

        data.put("resourceCenters", resourceCenterRepository.findAll().stream()
                .filter(rc -> rc.getStatus() == ResourceCenter.CenterStatus.ACTIVE)
                .map(rc -> marker("resource_center", rc.getCenterId(), rc.getName(),
                        rc.getLatitude(), rc.getLongitude(), null, rc.getStatus().name()))
                .collect(Collectors.toList()));

        data.put("teams", responseTeamRepository.findAll().stream()
                .filter(t -> t.getLatitude() != null && t.getLongitude() != null)
                .map(t -> {
                    Map<String, Object> m = marker("team", t.getTeamId(), t.getName(),
                            t.getLatitude(), t.getLongitude(), null, t.getAvailability().name());
                    m.put("skills", t.getSkills());
                    m.put("locationSource", "LAST_KNOWN");
                    m.put("lastUpdated", t.getCreatedAt());
                    teamAssignmentRepository.findByTeam_TeamId(t.getTeamId()).stream()
                            .filter(a -> a.getStatus() == TeamAssignment.AssignmentStatus.IN_PROGRESS)
                            .findFirst().ifPresent(a -> {
                                m.put("assignedDisasterId", a.getDisaster() != null ? a.getDisaster().getDisasterId() : null);
                                m.put("assignedLocationId", a.getLocation() != null ? a.getLocation().getLocationId() : null);
                            });
                    return m;
                }).collect(Collectors.toList()));

        data.put("dispatches", dispatchRepository.findAll().stream()
                .filter(d -> d.getStatus() == Dispatch.DispatchStatus.IN_TRANSIT
                        || d.getStatus() == Dispatch.DispatchStatus.CREATED)
                .map(d -> {
                    Location loc = d.getAllocation().getRequestItem().getRequest().getLocation();
                    return marker("dispatch", d.getDispatchId(),
                            d.getAllocation().getRequestItem().getResourceType().getName() + " → " + loc.getName(),
                            loc.getLatitude(), loc.getLongitude(), null, d.getStatus().name());
                }).collect(Collectors.toList()));

        data.put("routes", dispatchRepository.findAll().stream()
                .filter(d -> (d.getStatus() == Dispatch.DispatchStatus.IN_TRANSIT || d.getStatus() == Dispatch.DispatchStatus.CREATED)
                        && d.getAllocation() != null 
                        && d.getAllocation().getCenter() != null
                        && d.getAllocation().getRequestItem() != null
                        && d.getAllocation().getRequestItem().getRequest() != null
                        && d.getAllocation().getRequestItem().getRequest().getLocation() != null)
                .map(d -> {

                    ResourceCenter rc = d.getAllocation().getCenter();
                    Location loc = d.getAllocation().getRequestItem().getRequest().getLocation();
                    RequestItem ri = d.getAllocation().getRequestItem();
                    
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("id", d.getDispatchId());
                    r.put("status", d.getStatus().name());
                    
                    Map<String, Object> origin = new LinkedHashMap<>();
                    origin.put("lat", rc.getLatitude());
                    origin.put("lng", rc.getLongitude());
                    r.put("origin", origin);
                    r.put("originName", rc.getName());
                    
                    Map<String, Object> dest = new LinkedHashMap<>();
                    dest.put("lat", loc.getLatitude());
                    dest.put("lng", loc.getLongitude());
                    r.put("destination", dest);
                    r.put("destinationName", loc.getName());
                    
                    String unit = ri.getResourceType().getUnit() != null ? ri.getResourceType().getUnit() : "";
                    r.put("payload", d.getAllocation().getAllocatedQty() + " " + unit + " " + ri.getResourceType().getName());
                    r.put("teamName", d.getTeam() != null ? d.getTeam().getName() : "Logistics Fleet");
                    r.put("vehicleInfo", d.getVehicleInfo());
                    return r;
                }).collect(Collectors.toList()));

        data.put("fetchedAt", OffsetDateTime.now());
        return data;
    }

    private Map<String, Object> marker(String category, Long id, String name,
                                         java.math.BigDecimal lat, java.math.BigDecimal lon,
                                         Integer score, String status) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("category", category);
        m.put("id", id);
        m.put("name", name);
        m.put("latitude", lat);
        m.put("longitude", lon);
        if (score != null) m.put("score", score);
        if (status != null) m.put("status", status);
        return m;
    }
}
