package com.drro.controller;

import com.drro.dto.request.WeightConfigRequest;
import com.drro.dto.response.WeightConfigResponse;
import com.drro.service.WeightConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/weights")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WeightConfigController {
    private final WeightConfigService weightConfigService;

    @GetMapping
    public ResponseEntity<List<WeightConfigResponse>> getAll() {
        return ResponseEntity.ok(weightConfigService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<WeightConfigResponse> getActive() {
        return ResponseEntity.ok(weightConfigService.getActive());
    }

    @PostMapping
    public ResponseEntity<WeightConfigResponse> create(
            @Valid @RequestBody WeightConfigRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(weightConfigService.createAndActivate(request, auth.getName()));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<WeightConfigResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(weightConfigService.activate(id));
    }
}