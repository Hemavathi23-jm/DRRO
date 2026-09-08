package com.drro.service;

import com.drro.allocation.AllocationEngine;
import com.drro.dto.request.AllocationDecisionRequest;
import com.drro.dto.response.AllocationResponse;
import com.drro.entity.*;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AllocationService — orchestrates the allocation engine and manages
 * the full lifecycle of allocation recommendations:
 *
 *  1. runAllocation(strategy, disasterId)  → triggers engine for all VERIFIED requests
 *  2. decideAllocation(id, decision)       → officer approves / rejects / modifies
 *  3. Query methods for dashboard & review screens
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AllocationService {

    // All registered AllocationEngine implementations (Spring injects them as a list)
    private final List<AllocationEngine> engines;

    private final AllocationRepository        allocationRepository;
    private final AllocationFactorRepository  allocationFactorRepository;
    private final ReliefRequestRepository     requestRepository;
    private final RequestItemRepository       requestItemRepository;
    private final InventoryRepository         inventoryRepository;
    private final UserRepository              userRepository;
    private final DispatchRepository          dispatchRepository;
    private final AuditLogService             auditLogService;

    // -----------------------------------------------------------------------
    // 1. RUN ALLOCATION
    // -----------------------------------------------------------------------

    /**
     * Trigger allocation for all VERIFIED requests under a given disaster.
     *
     * @param strategyName  e.g. "GREEDY_PRIORITY", "FCFS_BASELINE", etc.
     * @param disasterId    scope allocation to a specific disaster
     * @return number of allocation records created
     */
    @Transactional
    public int runAllocation(String strategyName, Long disasterId) {
        AllocationEngine engine = resolveEngine(strategyName);

        List<ReliefRequest> openRequests = requestRepository
                .findByDisaster_DisasterIdOrderByCreatedAtDesc(disasterId)
                .stream()
                .filter(r -> r.getStatus() == ReliefRequest.RequestStatus.VERIFIED
                        || r.getStatus() == ReliefRequest.RequestStatus.PENDING
                        || r.getStatus() == ReliefRequest.RequestStatus.PARTIALLY_FULFILLED)
                .collect(Collectors.toList());

        if (openRequests.isEmpty()) {
            log.info("[AllocationService] No open/pending/verified requests found for disaster {}.", disasterId);
            return 0;
        }

        log.info("[AllocationService] Running '{}' on {} open requests for disaster {}.",
                strategyName, openRequests.size(), disasterId);

        int count = engine.allocate(openRequests);

        if (count > 0) {
            for (ReliefRequest req : openRequests) {
                req.setStatus(ReliefRequest.RequestStatus.ALLOCATED);
                requestRepository.save(req);
            }
        }

        log.info("[AllocationService] '{}' created {} allocations.", strategyName, count);
        return count;
    }

    /**
     * Trigger allocation across ALL disasters (all open/pending/verified requests system-wide).
     */
    @Transactional
    public int runAllocationGlobal(String strategyName) {
        AllocationEngine engine = resolveEngine(strategyName);

        List<ReliefRequest> openRequests = requestRepository
                .findByStatusIn(List.of(
                        ReliefRequest.RequestStatus.VERIFIED,
                        ReliefRequest.RequestStatus.PENDING,
                        ReliefRequest.RequestStatus.PARTIALLY_FULFILLED));

        if (openRequests.isEmpty()) {
            log.info("[AllocationService] No open/pending/verified requests found globally.");
            return 0;
        }

        int count = engine.allocate(openRequests);

        if (count > 0) {
            for (ReliefRequest req : openRequests) {
                req.setStatus(ReliefRequest.RequestStatus.ALLOCATED);
                requestRepository.save(req);
            }
        }

        log.info("[AllocationService] Global '{}' created {} allocations.", strategyName, count);
        return count;
    }

    // -----------------------------------------------------------------------
    // 2. OFFICER DECISION — APPROVE / REJECT / MODIFY
    // -----------------------------------------------------------------------

    /**
     * Officer reviews a RECOMMENDED allocation and makes a decision.
     *
     * @param allocationId  the allocation to act on
     * @param req           decision payload (APPROVED / REJECTED / MODIFIED + optional qty/notes)
     * @param officerEmail  authenticated officer's email
     * @return updated AllocationResponse
     */
    @Transactional
    public AllocationResponse decide(Long allocationId,
                                     AllocationDecisionRequest req,
                                     String officerEmail) {

        Allocation allocation = findAllocationOrThrow(allocationId);
        if (allocation.getStatus() != Allocation.AllocationStatus.RECOMMENDED) {
            throw new IllegalStateException("Only RECOMMENDED allocations can be decided. Current status: " + allocation.getStatus());
        }
        String previousValue = "status=" + allocation.getStatus() + ", allocatedQty=" + allocation.getAllocatedQty();
        User officer = userRepository.findByEmail(officerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + officerEmail));

        Allocation.AllocationStatus decision =
                Allocation.AllocationStatus.valueOf(req.getDecision().toUpperCase());

        switch (decision) {
            case APPROVED -> {
                allocation.setStatus(Allocation.AllocationStatus.APPROVED);
                allocation.setApprovedBy(officer);
                allocation.setApprovedAt(OffsetDateTime.now());
                if (req.getNotes() != null) allocation.setNotes(req.getNotes());
                
                // Auto-create dispatch ticket so it appears immediately on /dispatch board & map
                Dispatch dispatch = Dispatch.builder()
                        .allocation(allocation)
                        .dispatchedAt(OffsetDateTime.now())
                        .deliveredQty(BigDecimal.ZERO)
                        .status(Dispatch.DispatchStatus.CREATED)
                        .vehicleInfo("Relief Fleet Transport")
                        .createdBy(officer)
                        .notes(req.getNotes())
                        .build();
                dispatchRepository.save(dispatch);
                allocation.setStatus(Allocation.AllocationStatus.DISPATCHED);
                log.info("[AllocationService] Allocation {} APPROVED & DISPATCHED by {}.", allocationId, officerEmail);
            }
            case REJECTED -> {
                releaseInventory(allocation);
                allocation.setStatus(Allocation.AllocationStatus.REJECTED);
                allocation.setApprovedBy(officer);
                allocation.setApprovedAt(OffsetDateTime.now());
                if (req.getNotes() != null) allocation.setNotes(req.getNotes());
                log.info("[AllocationService] Allocation {} REJECTED by {}.", allocationId, officerEmail);
            }
            case MODIFIED -> {
                if (req.getOverrideQty() == null || req.getOverrideQty().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("overrideQty must be > 0 for MODIFIED decision.");
                }
                BigDecimal oldQty = allocation.getAllocatedQty();
                BigDecimal newQty = req.getOverrideQty();
                BigDecimal diff   = newQty.subtract(oldQty);

                adjustInventoryReservation(allocation, diff);

                allocation.setAllocatedQty(newQty);
                allocation.setStatus(Allocation.AllocationStatus.MODIFIED);
                allocation.setApprovedBy(officer);
                allocation.setApprovedAt(OffsetDateTime.now());
                if (req.getNotes() != null) allocation.setNotes(req.getNotes());
                log.info("[AllocationService] Allocation {} MODIFIED to qty={} by {}.",
                        allocationId, newQty, officerEmail);
            }
            default -> throw new IllegalArgumentException(
                    "Invalid decision: " + req.getDecision() + ". Use APPROVED, REJECTED, or MODIFIED.");
        }

        Allocation saved = allocationRepository.save(allocation);
        auditLogService.record(officer, "ALLOCATION_" + decision.name(), "Allocation", saved.getAllocationId(),
                previousValue, "status=" + saved.getStatus() + ", allocatedQty=" + saved.getAllocatedQty());
        return toResponse(saved);
    }

    // -----------------------------------------------------------------------
    // 3. QUERY METHODS
    // -----------------------------------------------------------------------

    /** All allocation recommendations, newest persistence order first. */
    public List<AllocationResponse> getAll() {
        return allocationRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }
    /** All allocations with a given status (e.g. RECOMMENDED, APPROVED) */
    public List<AllocationResponse> getByStatus(String status) {
        Allocation.AllocationStatus s = Allocation.AllocationStatus.valueOf(status.toUpperCase());
        return allocationRepository.findByStatus(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** All allocations for a specific request item */
    public List<AllocationResponse> getByRequestItem(Long requestItemId) {
        return allocationRepository.findByRequestItem_RequestItemId(requestItemId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** All allocations sourced from a specific resource center */
    public List<AllocationResponse> getByCenter(Long centerId) {
        return allocationRepository.findByCenter_CenterId(centerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Single allocation by ID */
    public AllocationResponse getById(Long id) {
        return toResponse(findAllocationOrThrow(id));
    }

    /** All allocations for a specific relief request */
    public List<AllocationResponse> getByRequest(Long requestId) {
        return allocationRepository.findByRequestItem_Request_RequestId(requestId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** List all available strategy names */
    public List<String> availableStrategies() {
        return engines.stream().map(AllocationEngine::strategyName).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // PRIVATE HELPERS
    // -----------------------------------------------------------------------

    private AllocationEngine resolveEngine(String strategyName) {
        return engines.stream()
                .filter(e -> e.strategyName().equalsIgnoreCase(strategyName))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Unknown allocation strategy: " + strategyName
                        + ". Available: " + availableStrategies()));
    }

    private Allocation findAllocationOrThrow(Long id) {
        return allocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation not found: " + id));
    }

    /**
     * Release the reserved qty back to available when an allocation is rejected.
     * Uses findByCenter_CenterIdAndResourceType_ResourceTypeId so we find the row
     * even when availableQty = 0 (all stock was reserved).
     */
    private void releaseInventory(Allocation allocation) {
        Long centerId = allocation.getCenter().getCenterId();
        Long typeId   = allocation.getRequestItem().getResourceType().getResourceTypeId();
        inventoryRepository
                .findByCenter_CenterIdAndResourceType_ResourceTypeId(centerId, typeId)
                .ifPresent(inv -> {
                    inv.setReservedQty(inv.getReservedQty().subtract(allocation.getAllocatedQty()));
                    inv.setAvailableQty(inv.getAvailableQty().add(allocation.getAllocatedQty()));
                    inventoryRepository.save(inv);
                    log.info("[AllocationService] Released {} units back to center '{}'.",
                            allocation.getAllocatedQty(), allocation.getCenter().getName());
                });
    }

    /**
     * Adjust inventory reservation when an allocation is modified.
     * diff > 0 → increase reservation (reduce available further)
     * diff < 0 → decrease reservation (return some qty to available)
     */
    private void adjustInventoryReservation(Allocation allocation, BigDecimal diff) {
        Long centerId = allocation.getCenter().getCenterId();
        Long typeId   = allocation.getRequestItem().getResourceType().getResourceTypeId();
        inventoryRepository
                .findByCenter_CenterIdAndResourceType_ResourceTypeId(centerId, typeId)
                .ifPresent(inv -> {
                    BigDecimal newReserved = inv.getReservedQty().add(diff);
                    BigDecimal newAvailable = inv.getAvailableQty().subtract(diff);
                    if (newReserved.compareTo(BigDecimal.ZERO) < 0
                            || newAvailable.compareTo(BigDecimal.ZERO) < 0) {
                        throw new IllegalArgumentException(
                                "Insufficient inventory to modify allocation quantity.");
                    }
                    inv.setReservedQty(newReserved);
                    inv.setAvailableQty(newAvailable);
                    inventoryRepository.save(inv);
                });
    }

    /**
     * Map Allocation entity → AllocationResponse DTO (with embedded factor fields).
     */
    private AllocationResponse toResponse(Allocation a) {
        AllocationResponse.AllocationResponseBuilder builder = AllocationResponse.builder()
                .allocationId(a.getAllocationId())
                .requestItemId(a.getRequestItem().getRequestItemId())
                .requestId(a.getRequestItem().getRequest().getRequestId())
                .resourceTypeName(a.getRequestItem().getResourceType().getName())
                .unit(a.getRequestItem().getResourceType().getUnit())
                .centerId(a.getCenter().getCenterId())
                .centerName(a.getCenter().getName())
                .allocatedQty(a.getAllocatedQty())
                .priorityScore(a.getPriorityScore())
                .status(a.getStatus().name())
                .recommendedAt(a.getRecommendedAt())
                .approvedById(a.getApprovedBy() != null ? a.getApprovedBy().getUserId() : null)
                .approvedByName(a.getApprovedBy() != null ? a.getApprovedBy().getName() : null)
                .approvedAt(a.getApprovedAt())
                .notes(a.getNotes());

        // Embed explanation factors if present
        allocationFactorRepository.findByAllocation_AllocationId(a.getAllocationId())
                .ifPresent(f -> builder
                        .severityScore(f.getSeverityScore())
                        .populationScore(f.getPopulationScore())
                        .urgencyScore(f.getUrgencyScore())
                        .shortageScore(f.getShortageScore())
                        .travelTimeScore(f.getTravelTimeScore())
                        .vulnerabilityScore(f.getVulnerabilityScore())
                        .finalScore(f.getFinalScore())
                        .distanceKm(f.getDistanceKm())
                        .estimatedTravelHrs(f.getEstimatedTravelHrs())
                        .explanationText(f.getExplanationText()));

        return builder.build();
    }
}
