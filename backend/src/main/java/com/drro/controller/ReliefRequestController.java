package com.drro.controller;

import com.drro.dto.request.ReliefRequestRequest;
import com.drro.dto.response.ReliefRequestResponse;
import com.drro.service.ReliefRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/relief-requests", "/api/requests"})
@RequiredArgsConstructor
@Tag(name = "Relief Requests", description = "Create and manage relief requests")
public class ReliefRequestController {

    private final ReliefRequestService reliefRequestService;

    @GetMapping
    @Operation(summary = "Get all requests, optionally filtered by disaster or status")
    public ResponseEntity<List<ReliefRequestResponse>> getAll(
            @RequestParam(required = false) Long disasterId,
            @RequestParam(required = false) String status) {
        if (disasterId != null) return ResponseEntity.ok(reliefRequestService.getByDisaster(disasterId));
        if (status != null) return ResponseEntity.ok(reliefRequestService.getByStatus(status));
        return ResponseEntity.ok(reliefRequestService.getAll());
    }

    @GetMapping("/open")
    @Operation(summary = "Get verified, unallocated relief requests")
    public ResponseEntity<List<ReliefRequestResponse>> getOpen() {
        return ResponseEntity.ok(reliefRequestService.getOpen());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReliefRequestResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reliefRequestService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER','FIELD_OPERATOR')")
    public ResponseEntity<ReliefRequestResponse> create(
            @Valid @RequestBody ReliefRequestRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reliefRequestService.create(request, auth.getName()));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ReliefRequestResponse> verify(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(reliefRequestService.verify(id, auth.getName()));
    }

    @PatchMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ReliefRequestResponse> escalate(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(reliefRequestService.escalate(id, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ReliefRequestResponse> update(
            @PathVariable Long id, @Valid @RequestBody ReliefRequestRequest request) {
        return ResponseEntity.ok(reliefRequestService.update(id, request));
    }
}