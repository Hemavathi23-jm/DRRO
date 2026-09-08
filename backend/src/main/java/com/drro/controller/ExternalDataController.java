package com.drro.controller;

import com.drro.service.ExternalDataFetchService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/external-data")
@RequiredArgsConstructor
@Tag(name = "External Data")
public class ExternalDataController {

    private final ExternalDataFetchService externalDataFetchService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(externalDataFetchService.getLastFetchStatus());
    }

    @PostMapping("/fetch")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<Map<String, Object>> fetchNow() {
        return ResponseEntity.ok(externalDataFetchService.fetch());
    }
}
