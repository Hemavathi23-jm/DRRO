package com.drro.service;

import com.drro.entity.*;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ReportService — aggregates operational metrics and algorithm comparison data.
 *
 * Key reports:
 *  1. metrics()             — dashboard KPI summary
 *  2. baselineComparison()  — compare GREEDY vs baselines (FCFS, SEVERITY_ONLY, NEAREST_SOURCE)
 *  3. unmetDemand()         — unmet demand per location
 *  4. utilization()         — inventory utilization per center
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final AllocationRepository       allocationRepository;
    private final AllocationFactorRepository allocationFactorRepository;
    private final ReliefRequestRepository    requestRepository;
    private final RequestItemRepository      requestItemRepository;
    private final InventoryRepository        inventoryRepository;
    private final DispatchRepository         dispatchRepository;
    private final LocationRepository         locationRepository;
    private final DisasterRepository         disasterRepository;

    // -----------------------------------------------------------------------
    // 1. DASHBOARD METRICS
    // -----------------------------------------------------------------------

    /**
     * Returns a KPI summary map for the dashboard.
     */
    public Map<String, Object> metrics() {
        Map<String, Object> m = new LinkedHashMap<>();

        long activeDisasters = disasterRepository.findAll().stream()
                .filter(disaster -> disaster.getStatus() == Disaster.DisasterStatus.ACTIVE)
                .count();
        // Active disasters (derived from requests with ACTIVE implied by status)
        long openRequests = requestRepository.findByStatus(ReliefRequest.RequestStatus.VERIFIED).size()
                + requestRepository.findByStatus(ReliefRequest.RequestStatus.PENDING).size();

        long pendingApprovals = allocationRepository
                .findByStatus(Allocation.AllocationStatus.RECOMMENDED).size();

        long activeDispatches = dispatchRepository
                .findByStatus(Dispatch.DispatchStatus.IN_TRANSIT).size()
                + dispatchRepository.findByStatus(Dispatch.DispatchStatus.CREATED).size();

        long fulfilledToday = requestRepository
                .findByStatus(ReliefRequest.RequestStatus.FULFILLED)
                .stream()
                .filter(r -> r.getUpdatedAt() != null
                        && r.getUpdatedAt().isAfter(OffsetDateTime.now().minusHours(24)))
                .count();

        long lowStockAlerts = inventoryRepository.findAll()
                .stream()
                .filter(inv -> inv.getMinStockLevel() != null
                        && inv.getAvailableQty().compareTo(inv.getMinStockLevel()) < 0)
                .count();

        long totalAllocations = allocationRepository.count();
        long approvedAllocations = allocationRepository
                .findByStatus(Allocation.AllocationStatus.APPROVED).size();
        long deliveredAllocations = allocationRepository
                .findByStatus(Allocation.AllocationStatus.DELIVERED).size();

        // Overall fulfillment rate
        List<RequestItem> allItems = requestItemRepository.findAll();
        BigDecimal totalRequired  = allItems.stream()
                .map(RequestItem::getRequiredQty).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalFulfilled = allItems.stream()
                .map(i -> i.getFulfilledQty() != null ? i.getFulfilledQty() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        double fulfillmentRate = totalRequired.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : totalFulfilled.divide(totalRequired, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue();

        // Average priority score of all GREEDY allocations
        OptionalDouble avgScore = allocationFactorRepository.findAll()
                .stream()
                .filter(f -> f.getFinalScore() != null)
                .mapToDouble(f -> f.getFinalScore().doubleValue())
                .average();

        m.put("activeDisasters",    activeDisasters);
        m.put("openRequests",       openRequests);
        m.put("pendingApprovals",   pendingApprovals);
        m.put("activeDispatches",   activeDispatches);
        m.put("fulfilledToday",     fulfilledToday);
        m.put("lowStockAlerts",     lowStockAlerts);
        m.put("totalAllocations",   totalAllocations);
        m.put("approvedAllocations",approvedAllocations);
        m.put("deliveredAllocations",deliveredAllocations);
        m.put("fulfillmentRatePct", Math.round(fulfillmentRate * 100.0) / 100.0);
        m.put("avgPriorityScore",   avgScore.isPresent()
                ? Math.round(avgScore.getAsDouble() * 100.0) / 100.0 : 0.0);

        return m;
    }

    // -----------------------------------------------------------------------
    // 2. BASELINE COMPARISON
    // -----------------------------------------------------------------------

    /**
     * Compares allocation strategies by aggregating AllocationFactor data per strategy.
     *
     * Returns one entry per strategy: strategyName, allocationCount,
     * avgPriorityScore, avgDistanceKm, avgTravelHrs, fulfillmentCount.
     */
    public List<Map<String, Object>> baselineComparison() {
        // Group allocations by strategy name (stored in AllocationFactor explanation prefix
        // or inferred from priorityScore nullability for baselines)
        // We group by whether priorityScore is set (GREEDY sets it, baselines may not)
        // For a proper comparison we tag via explanationText prefix.

        List<AllocationFactor> factors = allocationFactorRepository.findAll();

        Map<String, List<AllocationFactor>> grouped = factors.stream()
                .collect(Collectors.groupingBy(f -> {
                    String text = f.getExplanationText() != null
                            ? f.getExplanationText().toLowerCase() : "";
                    if (text.contains("nearest-source"))  return "NEAREST_SOURCE_BASELINE";
                    if (text.contains("fcfs"))            return "FCFS_BASELINE";
                    if (text.contains("severity-only"))   return "SEVERITY_ONLY_BASELINE";
                    return "GREEDY_PRIORITY";
                }));

        List<Map<String, Object>> result = new ArrayList<>();
        grouped.forEach((strategy, list) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("strategy", strategy);
            entry.put("allocationCount", list.size());
            entry.put("avgPriorityScore", list.stream()
                    .filter(f -> f.getFinalScore() != null)
                    .mapToDouble(f -> f.getFinalScore().doubleValue())
                    .average().orElse(0.0));
            entry.put("avgDistanceKm", list.stream()
                    .filter(f -> f.getDistanceKm() != null)
                    .mapToDouble(f -> f.getDistanceKm().doubleValue())
                    .average().orElse(0.0));
            entry.put("avgTravelHrs", list.stream()
                    .filter(f -> f.getEstimatedTravelHrs() != null)
                    .mapToDouble(f -> f.getEstimatedTravelHrs().doubleValue())
                    .average().orElse(0.0));
            result.add(entry);
        });

        result.sort(Comparator.comparing(e -> e.get("strategy").toString()));
        return result;
    }

    // -----------------------------------------------------------------------
    // 3. UNMET DEMAND
    // -----------------------------------------------------------------------

    /**
     * Returns unmet demand aggregated per location.
     * unmetQty = sum(requiredQty - fulfilledQty) for OPEN/PARTIAL items.
     */
    public List<Map<String, Object>> unmetDemand() {
        List<Map<String, Object>> result = new ArrayList<>();

        List<RequestItem> openItems = requestItemRepository.findByStatusInWithDetails(
                RequestItem.ItemStatus.OPEN, RequestItem.ItemStatus.PARTIAL);

        for (RequestItem item : openItems) {
            BigDecimal fulfilled = item.getFulfilledQty() != null
                    ? item.getFulfilledQty() : BigDecimal.ZERO;
            BigDecimal unmet = item.getRequiredQty().subtract(fulfilled);
            if (unmet.compareTo(BigDecimal.ZERO) > 0) {
                ReliefRequest req = item.getRequest();
                Location loc = req != null ? req.getLocation() : null;

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("requestId",        req != null ? req.getRequestId() : null);
                entry.put("locationId",       loc != null ? loc.getLocationId() : null);
                entry.put("locationName",     loc != null ? loc.getName() : "Unknown Location");
                entry.put("resourceTypeId",   item.getResourceType().getResourceTypeId());
                entry.put("resourceTypeName", item.getResourceType().getName());
                entry.put("unit",             item.getResourceType().getUnit());
                entry.put("resourceName",     item.getResourceType().getName() + " (" + item.getResourceType().getUnit() + ")");
                entry.put("unmetQty",         unmet);
                entry.put("requiredQty",      item.getRequiredQty());
                entry.put("fulfilledQty",     fulfilled);
                entry.put("urgency",          (req != null && req.getUrgency() != null) ? req.getUrgency().name() : "NORMAL");
                entry.put("severity",         loc != null ? loc.getSeverityScore() : 0);
                entry.put("population",       loc != null ? loc.getPopulationAffected() : 0);
                result.add(entry);
            }
        }

        // Sort by unmet qty descending
        result.sort((a, b) -> ((BigDecimal) b.get("unmetQty"))
                .compareTo((BigDecimal) a.get("unmetQty")));
        return result;
    }

    // -----------------------------------------------------------------------
    // 4. RESOURCE UTILIZATION
    // -----------------------------------------------------------------------

    /**
     * Returns inventory utilization per resource center.
     */
    public List<Map<String, Object>> utilization() {
        List<Map<String, Object>> result = new ArrayList<>();

        Map<Long, List<Inventory>> byCenterId = inventoryRepository.findAllWithCenterAndType()
                .stream().collect(Collectors.groupingBy(
                        inv -> inv.getCenter().getCenterId()));

        byCenterId.forEach((centerId, items) -> {
            String centerName = items.get(0).getCenter().getName();
            BigDecimal totalAvailable = items.stream()
                    .map(Inventory::getAvailableQty).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalReserved = items.stream()
                    .map(Inventory::getReservedQty).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalDispatched = items.stream()
                    .map(Inventory::getDispatchedQty).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal grandTotal = totalAvailable.add(totalReserved).add(totalDispatched);

            double utilPct = grandTotal.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                    : totalReserved.add(totalDispatched)
                            .divide(grandTotal, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue();

            long lowStockItems = items.stream()
                    .filter(inv -> inv.getMinStockLevel() != null
                            && inv.getAvailableQty().compareTo(inv.getMinStockLevel()) < 0)
                    .count();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("centerId",       centerId);
            entry.put("centerName",     centerName);
            entry.put("totalAvailable", totalAvailable);
            entry.put("totalReserved",  totalReserved);
            entry.put("totalDispatched",totalDispatched);
            entry.put("utilizationPct", Math.round(utilPct * 100.0) / 100.0);
            entry.put("lowStockItems",  lowStockItems);
            result.add(entry);
        });

        result.sort(Comparator.comparingDouble(
                e -> -((Number) e.get("utilizationPct")).doubleValue()));
        return result;
    }
}
