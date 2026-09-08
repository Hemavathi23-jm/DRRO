package com.drro.controller;

import com.drro.dto.request.DispatchRequest;
import com.drro.dto.response.DispatchResponse;
import com.drro.service.DispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DispatchController — REST API for managing resource dispatches.
 *
 * Base path: /api/dispatches
 *
 * Endpoints:
 *   POST   /                              → create dispatch from approved allocation
 *   GET    /                              → list all dispatches
 *   GET    /{id}                          → get single dispatch
 *   GET    /status/{status}               → filter by status
 *   GET    /allocation/{allocationId}     → dispatches for an allocation
 *   PUT    /{id}/in-transit               → mark IN_TRANSIT
 *   PUT    /{id}/delivered                → mark DELIVERED (with deliveredQty)
 *   PUT    /{id}/failed                   → mark FAILED (with optional reason)
 */
@RestController
@RequestMapping({"/api/dispatches", "/api/dispatch"})
@RequiredArgsConstructor
public class DispatchController {

    private final DispatchService dispatchService;

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    /**
     * Create a dispatch from an APPROVED allocation.
     * Roles: ADMIN, OFFICER
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<DispatchResponse> create(
            @RequestBody DispatchRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(dispatchService.create(req, auth.getName()));
    }

    // -----------------------------------------------------------------------
    // QUERIES
    // -----------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<List<DispatchResponse>> getAll() {
        return ResponseEntity.ok(dispatchService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DispatchResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.getById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<DispatchResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(dispatchService.getByStatus(status));
    }

    @GetMapping("/allocation/{allocationId}")
    public ResponseEntity<List<DispatchResponse>> getByAllocation(@PathVariable Long allocationId) {
        return ResponseEntity.ok(dispatchService.getByAllocation(allocationId));
    }

    // -----------------------------------------------------------------------
    // STATUS TRANSITIONS
    // -----------------------------------------------------------------------

    /**
     * Mark dispatch as IN_TRANSIT.
     * PUT /api/dispatches/{id}/in-transit
     */
    @PutMapping("/{id}/in-transit")
    public ResponseEntity<DispatchResponse> markInTransit(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.markInTransit(id));
    }

    @PutMapping("/{id}/delivered")
    public ResponseEntity<DispatchResponse> markDelivered(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return deliver(id, body);
    }

    @PatchMapping("/{id}/deliver")
    public ResponseEntity<DispatchResponse> deliver(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (body == null || !body.containsKey("deliveredQty")) {
            throw new IllegalArgumentException("deliveredQty is required");
        }
        BigDecimal qty = new BigDecimal(body.get("deliveredQty").toString());
        if (qty.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("deliveredQty cannot be negative");
        }
        return ResponseEntity.ok(dispatchService.markDelivered(id, qty));
    }

    /**
     * Mark dispatch as FAILED.
     * PUT /api/dispatches/{id}/failed
     * Body (optional): { "reason": "Vehicle breakdown" }
     */
    @PutMapping("/{id}/failed")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<DispatchResponse> markFailed(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = (body != null && body.containsKey("reason"))
                ? body.get("reason").toString() : null;
        return ResponseEntity.ok(dispatchService.markFailed(id, reason));
    }
}
