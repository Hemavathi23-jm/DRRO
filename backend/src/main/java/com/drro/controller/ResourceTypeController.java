package com.drro.controller;

import com.drro.dto.request.ResourceTypeRequest;
import com.drro.dto.response.ResourceTypeResponse;
import com.drro.service.ResourceTypeService;
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
@RequestMapping("/api/resource-types")
@RequiredArgsConstructor
@Tag(name = "Resource Types", description = "Manage resource type catalogue")
public class ResourceTypeController {

    private final ResourceTypeService resourceTypeService;

    @GetMapping
    @Operation(summary = "Get all resource types")
    public ResponseEntity<List<ResourceTypeResponse>> getAll() {
        return ResponseEntity.ok(resourceTypeService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get resource type by ID")
    public ResponseEntity<ResourceTypeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceTypeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESOURCE_MANAGER')")
    @Operation(summary = "Create a resource type")
    public ResponseEntity<ResourceTypeResponse> create(@Valid @RequestBody ResourceTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceTypeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESOURCE_MANAGER')")
    @Operation(summary = "Update a resource type")
    public ResponseEntity<ResourceTypeResponse> update(
            @PathVariable Long id, @Valid @RequestBody ResourceTypeRequest request) {
        return ResponseEntity.ok(resourceTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a resource type")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resourceTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
