package com.drro.controller;

import com.drro.dto.request.AllocationDecisionRequest;
import com.drro.dto.response.AllocationResponse;
import com.drro.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/allocations", "/api/allocation"})
@RequiredArgsConstructor
public class AllocationController {
    private final AllocationService allocationService;

    @PostMapping({"/run", "/recommend"})
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<Map<String, Object>> runAllocation(@RequestBody Map<String, Object> body) {
        String strategy = (String) body.getOrDefault("strategy", "GREEDY_PRIORITY");
        Long disasterId = body.containsKey("disasterId") ? Long.valueOf(body.get("disasterId").toString()) : null;
        int count = disasterId == null ? allocationService.runAllocationGlobal(strategy)
                : allocationService.runAllocation(strategy, disasterId);
        return ResponseEntity.ok(Map.of("strategy", strategy, "allocationsCreated", count,
                "message", count + " allocation record(s) created."));
    }

    @GetMapping
    public ResponseEntity<List<AllocationResponse>> listAll() { return ResponseEntity.ok(allocationService.getAll()); }
    @GetMapping("/strategies")
    public ResponseEntity<List<String>> strategies() { return ResponseEntity.ok(allocationService.availableStrategies()); }
    @GetMapping("/recommendations")
    public ResponseEntity<List<AllocationResponse>> recommendations() { return ResponseEntity.ok(allocationService.getAll()); }
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AllocationResponse>> byStatus(@PathVariable String status) { return ResponseEntity.ok(allocationService.getByStatus(status)); }
    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<AllocationResponse>> byRequest(@PathVariable Long requestId) { return ResponseEntity.ok(allocationService.getByRequest(requestId)); }
    @GetMapping("/request-item/{requestItemId}")
    public ResponseEntity<List<AllocationResponse>> byRequestItem(@PathVariable Long requestItemId) { return ResponseEntity.ok(allocationService.getByRequestItem(requestItemId)); }
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<AllocationResponse>> byCenter(@PathVariable Long centerId) { return ResponseEntity.ok(allocationService.getByCenter(centerId)); }
    @GetMapping("/{id}")
    public ResponseEntity<AllocationResponse> getById(@PathVariable Long id) { return ResponseEntity.ok(allocationService.getById(id)); }

    @PutMapping("/{id}/decide")
    public ResponseEntity<AllocationResponse> decide(@PathVariable Long id, @RequestBody AllocationDecisionRequest request, Authentication auth) {
        return ResponseEntity.ok(allocationService.decide(id, request, getEmail(auth)));
    }
    @PostMapping("/{id}/approve")
    public ResponseEntity<AllocationResponse> approve(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(allocationService.decide(id, decision("APPROVED", null, body), getEmail(auth)));
    }
    @PostMapping("/{id}/reject")
    public ResponseEntity<AllocationResponse> reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(allocationService.decide(id, decision("REJECTED", null, body), getEmail(auth)));
    }
    @PutMapping("/{id}/modify")
    public ResponseEntity<AllocationResponse> modify(@PathVariable Long id, @RequestBody AllocationDecisionRequest request, Authentication auth) {
        request.setDecision("MODIFIED");
        return ResponseEntity.ok(allocationService.decide(id, request, getEmail(auth)));
    }
    private String getEmail(Authentication auth) {
        return (auth != null && auth.getName() != null) ? auth.getName() : "admin@drro.com";
    }
    private AllocationDecisionRequest decision(String value, BigDecimal quantity, Map<String, String> body) {
        return AllocationDecisionRequest.builder().decision(value).overrideQty(quantity)
                .notes(body == null ? null : body.get("notes")).build();
    }
}