package com.drro.controller;

import com.drro.dto.response.SafePlaceResponse;
import com.drro.service.MapDataService;
import com.drro.service.ReportService;
import com.drro.service.SafePlaceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard")
public class DashboardController {

    private final ReportService reportService;
    private final MapDataService mapDataService;
    private final SafePlaceService safePlaceService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> data = reportService.metrics();
        data.put("unmetDemand", reportService.unmetDemand());
        data.put("utilization", reportService.utilization());
        data.put("baselineComparison", reportService.baselineComparison());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, Object>> mapData() {
        return ResponseEntity.ok(mapDataService.getOperationalMapData());
    }

    @GetMapping("/safe-places/{locationId}")
    public ResponseEntity<List<SafePlaceResponse>> safePlaces(
            @PathVariable Long locationId,
            @RequestParam(defaultValue = "50") double maxKm) {
        return ResponseEntity.ok(safePlaceService.suggestForLocation(locationId, maxKm));
    }
}
