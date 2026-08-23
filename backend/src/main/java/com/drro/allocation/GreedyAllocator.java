package com.drro.allocation;

import com.drro.entity.*;
import com.drro.repository.*;
import com.drro.util.HaversineUtil;
import com.drro.util.PriorityScoreCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Greedy Allocation Algorithm — Primary DRRO Strategy
 *
 * Algorithm:
 * 1. Collect all OPEN request items from the given VERIFIED requests
 * 2. Score each item using PriorityScoreCalculator (6-factor weighted score)
 * 3. Sort items by priority score DESCENDING (highest priority first)
 * 4. For each item, find all inventory records for the required resource type
 *    with available qty > 0, sorted by distance from the affected location
 * 5. Greedily allocate from the nearest center until demand is met or stock exhausted
 * 6. Save Allocation + AllocationFactor records for explainability
 * 7. Reserve inventory (move qty from available → reserved)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GreedyAllocator implements AllocationEngine {

    private final InventoryRepository inventoryRepository;
    private final AllocationRepository allocationRepository;
    private final AllocationFactorRepository allocationFactorRepository;
    private final RequestItemRepository requestItemRepository;
    private final HaversineUtil haversineUtil;
    private final PriorityScoreCalculator scoreCalculator;
    private final ExplanationGenerator explanationGenerator;

    @Override
    public String strategyName() {
        return "GREEDY_PRIORITY";
    }

    @Override
    @Transactional
    public int allocate(List<ReliefRequest> requests) {
        int totalAllocations = 0;

        // ---- Step 1: Collect all OPEN items ----------------------------------------
        List<RequestItem> allItems = requests.stream()
                .flatMap(r -> requestItemRepository.findByRequest_RequestId(r.getRequestId()).stream())
                .filter(i -> i.getStatus() == RequestItem.ItemStatus.OPEN
                        || i.getStatus() == RequestItem.ItemStatus.PARTIAL)
                .collect(Collectors.toList());

        if (allItems.isEmpty()) {
            log.info("[GreedyAllocator] No open items found in {} requests.", requests.size());
            return 0;
        }

        // ---- Step 2 & 3: Score and sort items descending ---------------------------
        // For scoring we need a center — use the best candidate found later.
        // Here we pre-score using a dummy pass, then sort by avg available score.
        // Full score is computed per (item, center) pair during allocation.
        allItems.sort(Comparator.comparingDouble(this::quickPriorityEstimate).reversed());

        log.info("[GreedyAllocator] Processing {} items across {} requests.",
                allItems.size(), requests.size());

        // ---- Step 4, 5, 6, 7: Greedy allocation per item --------------------------
        for (RequestItem item : allItems) {
            BigDecimal remaining = item.getRequiredQty()
                    .subtract(item.getFulfilledQty() != null ? item.getFulfilledQty() : BigDecimal.ZERO);

            if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

            // Find all inventory records with stock for this resource type
            List<Inventory> candidates = inventoryRepository
                    .findAvailableByResourceType(item.getResourceType().getResourceTypeId());

            if (candidates.isEmpty()) {
                log.warn("[GreedyAllocator] No stock available for resource type: {}",
                        item.getResourceType().getName());
                continue;
            }

            // Sort candidates by distance from affected location (nearest first)
            Location affectedLocation = item.getRequest().getLocation();
            candidates.sort(Comparator.comparingDouble(inv ->
                    haversineUtil.distanceKm(
                            affectedLocation.getLatitude().doubleValue(),
                            affectedLocation.getLongitude().doubleValue(),
                            inv.getCenter().getLatitude().doubleValue(),
                            inv.getCenter().getLongitude().doubleValue())));

            // Greedily pull from nearest centers
            for (Inventory inv : candidates) {
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

                BigDecimal canAllocate = inv.getAvailableQty().min(remaining);
                if (canAllocate.compareTo(BigDecimal.ZERO) <= 0) continue;

                // Calculate full priority score for this (item, center) pair
                PriorityScoreCalculator.ScoreBreakdown score =
                        scoreCalculator.calculate(item, inv.getCenter());

                // Create Allocation record
                Allocation allocation = Allocation.builder()
                        .requestItem(item)
                        .center(inv.getCenter())
                        .allocatedQty(canAllocate)
                        .priorityScore(score.finalScore())
                        .status(Allocation.AllocationStatus.RECOMMENDED)
                        .build();
                allocation = allocationRepository.save(allocation);

                // Create AllocationFactor record (explainability)
                String explanation = explanationGenerator.generate(score, item, inv.getCenter(), canAllocate);
                AllocationFactor factor = AllocationFactor.builder()
                        .allocation(allocation)
                        .severityScore(score.severityScore())
                        .populationScore(score.populationScore())
                        .urgencyScore(score.urgencyScore())
                        .shortageScore(score.shortageScore())
                        .travelTimeScore(score.travelTimeScore())
                        .vulnerabilityScore(score.vulnerabilityScore())
                        .finalScore(score.finalScore())
                        .distanceKm(score.distanceKm())
                        .estimatedTravelHrs(score.estimatedTravelHrs())
                        .explanationText(explanation)
                        .build();
                allocationFactorRepository.save(factor);

                // Reserve inventory: available → reserved
                inv.setAvailableQty(inv.getAvailableQty().subtract(canAllocate));
                inv.setReservedQty(inv.getReservedQty().add(canAllocate));
                inventoryRepository.save(inv);

                remaining = remaining.subtract(canAllocate);
                totalAllocations++;
                log.info("[GreedyAllocator] Allocated {} {} from center '{}' to item {} (score: {})",
                        canAllocate, item.getResourceType().getUnit(),
                        inv.getCenter().getName(), item.getRequestItemId(), score.finalScore());
            }

            // Update item fulfilled qty and status
            BigDecimal fulfilled = item.getRequiredQty().subtract(remaining);
            item.setFulfilledQty(fulfilled);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                item.setStatus(RequestItem.ItemStatus.FULFILLED);
            } else if (fulfilled.compareTo(BigDecimal.ZERO) > 0) {
                item.setStatus(RequestItem.ItemStatus.PARTIAL);
            }
            requestItemRepository.save(item);
        }

        log.info("[GreedyAllocator] Completed. Created {} allocation records.", totalAllocations);
        return totalAllocations;
    }

    // ---- helpers ---------------------------------------------------------------

    /**
     * Quick urgency-based estimate for initial sorting before full scoring.
     * Full scoring happens per (item, center) pair during allocation.
     */
    private double quickPriorityEstimate(RequestItem item) {
        double urgency = switch (item.getRequest().getUrgency()) {
            case CRITICAL -> 100.0;
            case HIGH     -> 75.0;
            case MEDIUM   -> 50.0;
            case LOW      -> 25.0;
        };
        double severity = item.getRequest().getDisaster().getSeverity() != null
                ? item.getRequest().getDisaster().getSeverity() : 0;
        return (urgency + severity) / 2.0;
    }
}
