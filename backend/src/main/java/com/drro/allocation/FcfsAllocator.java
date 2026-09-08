package com.drro.allocation;

import com.drro.entity.*;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Baseline Allocator 1 — First Come, First Served (FCFS)
 *
 * Allocates resources in the order requests were created (oldest first),
 * without any priority scoring. Used as a baseline for comparison
 * against the GreedyAllocator in the evaluation section.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FcfsAllocator implements AllocationEngine {

    private final InventoryRepository inventoryRepository;
    private final AllocationRepository allocationRepository;
    private final AllocationFactorRepository allocationFactorRepository;
    private final RequestItemRepository requestItemRepository;

    @Override
    public String strategyName() { return "FCFS_BASELINE"; }

    @Override
    @Transactional
    public int allocate(List<ReliefRequest> requests) {
        int count = 0;

        // Sort by created date ascending (oldest first = FCFS)
        List<ReliefRequest> sorted = requests.stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .collect(Collectors.toList());

        for (ReliefRequest req : sorted) {
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
                            .status(Allocation.AllocationStatus.RECOMMENDED)
                            .build();
                    allocationRepository.save(allocation);

                    // Minimal factor record (no scores — FCFS has no scoring)
                    AllocationFactor factor = AllocationFactor.builder()
                            .allocation(allocation)
                            .explanationText("FCFS baseline: allocated in order of request creation time.")
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
        log.info("[FcfsAllocator] Created {} allocations.", count);
        return count;
    }
}
