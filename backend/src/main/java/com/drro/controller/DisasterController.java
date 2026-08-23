package com.drro.controller;

import com.drro.dto.request.DisasterRequest;
import com.drro.dto.response.DisasterResponse;
import com.drro.service.DisasterService;
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
@RequestMapping("/api/disasters")
@RequiredArgsConstructor
@Tag(name = "Disasters", description = "Manage disaster incidents")
public class DisasterController {

    private final DisasterService disasterService;

    @GetMapping
    @Operation(summary = "Get all disasters")
    public ResponseEntity<List<DisasterResponse>> getAll(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank())
            return ResponseEntity.ok(disasterService.getByStatus(status));
        return ResponseEntity.ok(disasterService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get disaster by ID")
    public ResponseEntity<DisasterResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(disasterService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','OFFICER')")
    @Operation(summary = "Create a new disaster")
    public ResponseEntity<DisasterResponse> create(
            @Valid @RequestBody DisasterRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(disasterService.create(request, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','OFFICER')")
    @Operation(summary = "Update a disaster")
    public ResponseEntity<DisasterResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody DisasterRequest request) {
        return ResponseEntity.ok(disasterService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete a disaster")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        disasterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
