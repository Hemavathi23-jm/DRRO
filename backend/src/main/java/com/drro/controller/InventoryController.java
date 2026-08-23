package com.drro.controller;

import com.drro.dto.request.InventoryRequest;
import com.drro.dto.response.InventoryResponse;
import com.drro.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Manage resource inventory per center")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/center/{centerId}")
    @Operation(summary = "Get all inventory for a resource center")
    public ResponseEntity<List<InventoryResponse>> getByCenter(@PathVariable Long centerId) {
        return ResponseEntity.ok(inventoryService.getByCenter(centerId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single inventory record by ID")
    public ResponseEntity<InventoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getById(id));
    }

    @GetMapping("/available")
    @Operation(summary = "Get all centers with available stock of a resource type")
    public ResponseEntity<List<InventoryResponse>> getAvailable(@RequestParam Long resourceTypeId) {
        return ResponseEntity.ok(inventoryService.getAvailableByResourceType(resourceTypeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','RESOURCE_MANAGER')")
    @Operation(summary = "Create or update inventory record (upsert by center + resource type)")
    public ResponseEntity<InventoryResponse> upsert(@Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.ok(inventoryService.upsert(request));
    }

    @PatchMapping("/{id}/adjust")
    @PreAuthorize("hasAnyAuthority('ADMIN','RESOURCE_MANAGER')")
    @Operation(summary = "Adjust available qty (+/-)")
    public ResponseEntity<InventoryResponse> adjust(
            @PathVariable Long id,
            @RequestParam BigDecimal delta) {
        return ResponseEntity.ok(inventoryService.adjustQty(id, delta));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete an inventory record")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        inventoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
