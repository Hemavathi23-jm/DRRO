package com.drro.controller;

import com.drro.dto.request.ResourceCenterRequest;
import com.drro.dto.response.ResourceCenterResponse;
import com.drro.service.ResourceCenterService;
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
@RequestMapping("/api/resource-centers")
@RequiredArgsConstructor
@Tag(name = "Resource Centers", description = "Manage resource / supply centers")
public class ResourceCenterController {

    private final ResourceCenterService resourceCenterService;

    @GetMapping
    @Operation(summary = "Get all resource centers")
    public ResponseEntity<List<ResourceCenterResponse>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(activeOnly
                ? resourceCenterService.getActive()
                : resourceCenterService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get resource center by ID")
    public ResponseEntity<ResourceCenterResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceCenterService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','RESOURCE_MANAGER')")
    @Operation(summary = "Create a resource center")
    public ResponseEntity<ResourceCenterResponse> create(@Valid @RequestBody ResourceCenterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceCenterService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','RESOURCE_MANAGER')")
    @Operation(summary = "Update a resource center")
    public ResponseEntity<ResourceCenterResponse> update(
            @PathVariable Long id, @Valid @RequestBody ResourceCenterRequest request) {
        return ResponseEntity.ok(resourceCenterService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete a resource center")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resourceCenterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
