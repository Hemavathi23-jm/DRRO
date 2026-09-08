package com.drro.controller;

import com.drro.service.ReportPdfService;
import com.drro.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final ReportPdfService reportPdfService;

    @GetMapping("/metrics") public ResponseEntity<Map<String, Object>> metrics() { return ResponseEntity.ok(reportService.metrics()); }
    @GetMapping("/baseline-comparison") public ResponseEntity<List<Map<String, Object>>> baselineComparison() { return ResponseEntity.ok(reportService.baselineComparison()); }
    @GetMapping("/unmet-demand") public ResponseEntity<List<Map<String, Object>>> unmetDemand() { return ResponseEntity.ok(reportService.unmetDemand()); }
    @GetMapping("/utilization") public ResponseEntity<List<Map<String, Object>>> utilization() { return ResponseEntity.ok(reportService.utilization()); }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf() {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=drro-operational-summary.pdf")
                .contentType(MediaType.APPLICATION_PDF).body(reportPdfService.exportOperationalSummary());
    }
}