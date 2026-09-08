package com.drro.allocation;

import com.drro.entity.*;
import com.drro.repository.*;
import com.drro.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Baseline Allocator 3 — Nearest Source
 *
 * Allocates from the geographically nearest resource center only,
 * ignoring priority scores. Used as a baseline for comparison.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NearestSourceAllocator implements AllocationEngine {

    private final InventoryRepository inventoryRepository;
    private final AllocationRepository allocationRepository;
    private final AllocationFactorRepository allocationFactorRepository;
    private final RequestItemRepository requestItemRepository;
    private final HaversineUtil haversineUtil;

    @Override
    public String strategyName() { return "NEAREST_SOURCE_BASELINE"; }

    @Override
    @Transactional
    public int allocate(List<ReliefRequest> requests) {
        int count = 0;

        for (ReliefRequest req : requests) {
            Location loc = req.getLocation();
            List<RequestItem> items = requestItemRepository
                    .findByRequest_RequestId(req.getRequestId())
                    .stream()
                    .filter(i -> i.getStatus() == RequestItem.ItemStatus.OPEN)
                    .collect(Collectors.toList());

            for (RequestItem item : items) {
                BigDecimal remaining = item.getRequiredQty();

                // Sort candidates by distance — nearest first
                List<Inventory> candidates = inventoryRepository
                        .findAvailableByResourceType(item.getResourceType().getResourceTypeId())
                        .stream()
                        .sorted(Comparator.comparingDouble(inv ->
                                haversineUtil.distanceKm(
                                        loc.getLatitude().doubleValue(), loc.getLongitude().doubleValue(),
                                        inv.getCenter().getLatitude().doubleValue(),
                                        inv.getCenter().getLongitude().doubleValue())))
                        .collect(Collectors.toList());

                for (Inventory inv : candidates) {
                    if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
                    BigDecimal canAllocate = inv.getAvailableQty().min(remaining);
                    if (canAllocate.compareTo(BigDecimal.ZERO) <= 0) continue;

                    double distKm = haversineUtil.distanceKm(
                            loc.getLatitude().doubleValue(), loc.getLongitude().doubleValue(),
                            inv.getCenter().getLatitude().doubleValue(),
                            inv.getCenter().getLongitude().doubleValue());

                    Allocation allocation = Allocation.builder()
                            .requestItem(item)
                            .center(inv.getCenter())
                            .allocatedQty(canAllocate)
                            .status(Allocation.AllocationStatus.RECOMMENDED)
                            .build();
                    allocationRepository.save(allocation);

                    AllocationFactor factor = AllocationFactor.builder()
                            .allocation(allocation)
                            .distanceKm(BigDecimal.valueOf(distKm))
                            .estimatedTravelHrs(BigDecimal.valueOf(haversineUtil.estimatedTravelHours(distKm)))
                            .explanationText(String.format(
                                    "Nearest-source baseline: selected center '%s' at %.1f km (closest available).",
                                    inv.getCenter().getName(), distKm))
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
        log.info("[NearestSourceAllocator] Created {} allocations.", count);
        return count;
    }
}
