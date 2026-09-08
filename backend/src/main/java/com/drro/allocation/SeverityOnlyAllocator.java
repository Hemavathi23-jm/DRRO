package com.drro.allocation;

import com.drro.entity.*;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Baseline Allocator 2 — Severity Only
 *
 * Prioritises requests purely by disaster severity (1-100).
 * No distance, population, urgency, or shortage factors considered.
 * Used as a baseline for comparison against GreedyAllocator.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SeverityOnlyAllocator implements AllocationEngine {

    private final InventoryRepository inventoryRepository;
    private final AllocationRepository allocationRepository;
    private final AllocationFactorRepository allocationFactorRepository;
    private final RequestItemRepository requestItemRepository;

    @Override
    public String strategyName() { return "SEVERITY_ONLY_BASELINE"; }

    @Override
    @Transactional
    public int allocate(List<ReliefRequest> requests) {
        int count = 0;

        // Sort by disaster severity descending
        List<ReliefRequest> sorted = requests.stream()
                .sorted(Comparator.comparingInt(
                        (ReliefRequest r) -> r.getDisaster().getSeverity()).reversed())
                .collect(Collectors.toList());

        for (ReliefRequest req : sorted) {
            int severity = req.getDisaster().getSeverity();
            List<RequestItem> items = requestItemRepository
                    .findByRequest_RequestId(req.getRequestId())
                    .stream()
                    .filter(i -> i.getStatus() == RequestItem.ItemStatus.OPEN)
                    .collect(Collectors.toList());

            for (RequestItem item : items) {
                BigDecimal remaining = item.getRequiredQty();
                List<Inventory> candidates = inventoryRepository
                        .findAvailableByResourceType(item.getResourceType().getResourceTypeId());

                for (Inventory inv : candidates) {
                    if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
                    BigDecimal canAllocate = inv.getAvailableQty().min(remaining);
                    if (canAllocate.compareTo(BigDecimal.ZERO) <= 0) continue;

                    Allocation allocation = Allocation.builder()
                            .requestItem(item)
                            .center(inv.getCenter())
                            .allocatedQty(canAllocate)
                            .priorityScore(BigDecimal.valueOf(severity))
                            .status(Allocation.AllocationStatus.RECOMMENDED)
                            .build();
                    allocationRepository.save(allocation);

                    AllocationFactor factor = AllocationFactor.builder()
                            .allocation(allocation)
                            .severityScore(BigDecimal.valueOf(severity))
                            .finalScore(BigDecimal.valueOf(severity))
                            .explanationText("Severity-only baseline: ranked by disaster severity = " + severity)
                            .build();
                    allocationFactorRepository.save(factor);

                    inv.setAvailableQty(inv.getAvailableQty().subtract(canAllocate));
                    inv.setReservedQty(inv.getReservedQty().add(canAllocate));
                    inventoryRepository.save(inv);

                    remaining = remaining.subtract(canAllocate);
                    count++;
                }

                // fulfilledQty updated on delivery only
            }
        }
        log.info("[SeverityOnlyAllocator] Created {} allocations.", count);
        return count;
    }
}
