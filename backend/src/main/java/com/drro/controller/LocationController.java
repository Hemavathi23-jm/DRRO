package com.drro.controller;

import com.drro.dto.request.LocationRequest;
import com.drro.dto.response.LocationResponse;
import com.drro.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@Tag(name = "Locations", description = "Manage affected locations linked to disasters")
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    @Operation(summary = "Get all locations or filter by disaster")
    public ResponseEntity<List<LocationResponse>> getLocations(
            @RequestParam(required = false) Long disasterId) {
        return ResponseEntity.ok(locationService.getLocations(disasterId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get location by ID")
    public ResponseEntity<LocationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(locationService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    @Operation(summary = "Add a new affected location to a disaster")
    public ResponseEntity<LocationResponse> create(
            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(locationService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    @Operation(summary = "Update an affected location")
    public ResponseEntity<LocationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a location")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        locationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
