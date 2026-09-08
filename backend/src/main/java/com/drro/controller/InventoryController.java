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
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<List<InventoryResponse>> getByCenter(@PathVariable Long centerId) {
        return ResponseEntity.ok(inventoryService.getByCenter(centerId));
    }
    @GetMapping("/{id}")
    public ResponseEntity<InventoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getById(id));
    }
    @GetMapping("/available")
    public ResponseEntity<List<InventoryResponse>> getAvailable(@RequestParam Long resourceTypeId) {
        return ResponseEntity.ok(inventoryService.getAvailableByResourceType(resourceTypeId));
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESOURCE_MANAGER')")
    public ResponseEntity<InventoryResponse> upsert(@Valid @RequestBody InventoryRequest request, Authentication auth) {
        return ResponseEntity.ok(inventoryService.upsert(request, auth.getName()));
    }
    @PatchMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','RESOURCE_MANAGER')")
    public ResponseEntity<InventoryResponse> adjust(@PathVariable Long id, @RequestParam BigDecimal delta, Authentication auth) {
        return ResponseEntity.ok(inventoryService.adjustQty(id, delta, auth.getName()));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        inventoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}