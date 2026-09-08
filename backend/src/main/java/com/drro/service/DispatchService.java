package com.drro.service;

import com.drro.dto.request.DispatchRequest;
import com.drro.dto.response.DispatchResponse;
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
 * DispatchService — manages the lifecycle of resource dispatches.
 *
 * Flow:
 *   APPROVED allocation → create Dispatch (CREATED)
 *   → mark IN_TRANSIT
 *   → mark DELIVERED (records actualArrival + deliveredQty, adjusts inventory)
 *   → or mark FAILED
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DispatchService {

    private final DispatchRepository      dispatchRepository;
    private final AllocationRepository    allocationRepository;
    private final ResponseTeamRepository  responseTeamRepository;
    private final InventoryRepository     inventoryRepository;
    private final RequestItemRepository   requestItemRepository;
    private final ReliefRequestRepository reliefRequestRepository;
    private final UserRepository          userRepository;

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    /**
     * Create a Dispatch for an APPROVED allocation.
     * Sets allocation status to DISPATCHED and marks Dispatch as CREATED.
     */
    @Transactional
    public DispatchResponse create(DispatchRequest req, String creatorEmail) {
        Allocation allocation = allocationRepository.findById(req.getAllocationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Allocation not found: " + req.getAllocationId()));

        if (allocation.getStatus() != Allocation.AllocationStatus.APPROVED
                && allocation.getStatus() != Allocation.AllocationStatus.MODIFIED) {
            throw new IllegalStateException(
                    "Only APPROVED or MODIFIED allocations can be dispatched. Current status: "
                            + allocation.getStatus());
        }

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorEmail));

        ResponseTeam team = null;
        if (req.getTeamId() != null) {
            team = responseTeamRepository.findById(req.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "ResponseTeam not found: " + req.getTeamId()));
        }

        Dispatch dispatch = Dispatch.builder()
                .allocation(allocation)
                .team(team)
                .vehicleInfo(req.getVehicleInfo())
                .dispatchedAt(OffsetDateTime.now())
                .estimatedArrival(req.getEstimatedArrival())
                .deliveredQty(BigDecimal.ZERO)
                .status(Dispatch.DispatchStatus.CREATED)
                .createdBy(creator)
                .notes(req.getNotes())
                .build();

        Dispatch saved = dispatchRepository.save(dispatch);

        // Move allocation to DISPATCHED
        allocation.setStatus(Allocation.AllocationStatus.DISPATCHED);
        allocationRepository.save(allocation);

        log.info("[DispatchService] Dispatch {} created for allocation {}.",
                saved.getDispatchId(), allocation.getAllocationId());
        return toResponse(saved);
    }

    // -----------------------------------------------------------------------
    // STATUS TRANSITIONS
    // -----------------------------------------------------------------------

    /**
     * Mark dispatch as IN_TRANSIT.
     */
    @Transactional
    public DispatchResponse markInTransit(Long dispatchId) {
        Dispatch dispatch = findOrThrow(dispatchId);
        if (dispatch.getStatus() != Dispatch.DispatchStatus.CREATED) {
            throw new IllegalStateException(
                    "Dispatch must be in CREATED status to mark IN_TRANSIT. Current: "
                            + dispatch.getStatus());
        }
        dispatch.setStatus(Dispatch.DispatchStatus.IN_TRANSIT);
        commitDispatchedInventory(dispatch);
        log.info("[DispatchService] Dispatch {} marked IN_TRANSIT.", dispatchId);
        return toResponse(dispatchRepository.save(dispatch));
    }

    /**
     * Mark dispatch as DELIVERED.
     * Records actualArrival, deliveredQty, commits inventory deduction,
     * and updates the request item fulfillment status.
     *
     * @param deliveredQty  actual quantity delivered (may differ from allocated)
     */
    @Transactional
    public DispatchResponse markDelivered(Long dispatchId, BigDecimal deliveredQty) {
        Dispatch dispatch = findOrThrow(dispatchId);
        if (dispatch.getStatus() != Dispatch.DispatchStatus.IN_TRANSIT
                && dispatch.getStatus() != Dispatch.DispatchStatus.CREATED) {
            throw new IllegalStateException(
                    "Dispatch must be IN_TRANSIT or CREATED to mark DELIVERED. Current: "
                            + dispatch.getStatus());
        }

        dispatch.setStatus(Dispatch.DispatchStatus.DELIVERED);
        dispatch.setActualArrival(OffsetDateTime.now());
        dispatch.setDeliveredQty(deliveredQty);
        dispatchRepository.save(dispatch);

        // ---- Commit inventory: deduct from reservedQty ----
        Allocation allocation = dispatch.getAllocation();
        Long centerId = allocation.getCenter().getCenterId();
        Long typeId   = allocation.getRequestItem().getResourceType().getResourceTypeId();

        inventoryRepository
                .findByCenter_CenterIdAndResourceType_ResourceTypeId(centerId, typeId)
                .ifPresent(inv -> {
                    BigDecimal toDeduct = allocation.getAllocatedQty().min(inv.getReservedQty().max(BigDecimal.ZERO));
                    inv.setReservedQty(inv.getReservedQty().subtract(toDeduct).max(BigDecimal.ZERO));
                    inv.setDeliveredQty(inv.getDeliveredQty().add(deliveredQty));
                    inventoryRepository.save(inv);
                    log.info("[DispatchService] Committed {} units from center '{}' inventory.",
                            toDeduct, allocation.getCenter().getName());
                });

        // ---- Update allocation status to DELIVERED ----
        allocation.setStatus(Allocation.AllocationStatus.DELIVERED);
        allocationRepository.save(allocation);

        // ---- Update request item fulfilled qty ----
        RequestItem item = allocation.getRequestItem();
        BigDecimal newFulfilled = (item.getFulfilledQty() != null
                ? item.getFulfilledQty() : BigDecimal.ZERO).add(deliveredQty);
        item.setFulfilledQty(newFulfilled);
        item.setStatus(newFulfilled.compareTo(item.getRequiredQty()) >= 0
                ? RequestItem.ItemStatus.FULFILLED : RequestItem.ItemStatus.PARTIAL);
        requestItemRepository.save(item);

        // ---- Update overall relief request status ----
        updateRequestStatus(item.getRequest());

        log.info("[DispatchService] Dispatch {} DELIVERED — {} units.", dispatchId, deliveredQty);
        return toResponse(dispatch);
    }

    /**
     * Mark dispatch as FAILED and release the reserved inventory.
     */
    @Transactional
    public DispatchResponse markFailed(Long dispatchId, String reason) {
        Dispatch dispatch = findOrThrow(dispatchId);
        dispatch.setStatus(Dispatch.DispatchStatus.FAILED);
        if (reason != null) dispatch.setNotes(reason);
        dispatchRepository.save(dispatch);

        // Release reserved inventory back to available
        Allocation allocation = dispatch.getAllocation();
        Long centerId = allocation.getCenter().getCenterId();
        Long typeId   = allocation.getRequestItem().getResourceType().getResourceTypeId();

        inventoryRepository
                .findByCenter_CenterIdAndResourceType_ResourceTypeId(centerId, typeId)
                .ifPresent(inv -> {
                    BigDecimal release = allocation.getAllocatedQty().min(inv.getReservedQty().max(BigDecimal.ZERO));
                    inv.setReservedQty(inv.getReservedQty().subtract(release).max(BigDecimal.ZERO));
                    inv.setAvailableQty(inv.getAvailableQty().add(release));
                    inventoryRepository.save(inv);
                    log.info("[DispatchService] Released {} units back to center '{}' after FAILED dispatch.",
                            release, allocation.getCenter().getName());
                });

        allocation.setStatus(Allocation.AllocationStatus.APPROVED);
        allocationRepository.save(allocation);

        log.info("[DispatchService] Dispatch {} marked FAILED.", dispatchId);
        return toResponse(dispatch);
    }

    // -----------------------------------------------------------------------
    // QUERIES
    // -----------------------------------------------------------------------

    public DispatchResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public List<DispatchResponse> getByAllocation(Long allocationId) {
        return dispatchRepository.findByAllocation_AllocationId(allocationId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DispatchResponse> getByStatus(String status) {
        Dispatch.DispatchStatus s = Dispatch.DispatchStatus.valueOf(status.toUpperCase());
        return dispatchRepository.findByStatus(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DispatchResponse> getAll() {
        return dispatchRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // PRIVATE HELPERS
    // -----------------------------------------------------------------------

    private void commitDispatchedInventory(Dispatch dispatch) {
        Allocation allocation = dispatch.getAllocation();
        Long centerId = allocation.getCenter().getCenterId();
        Long typeId   = allocation.getRequestItem().getResourceType().getResourceTypeId();
        inventoryRepository
                .findByCenter_CenterIdAndResourceType_ResourceTypeId(centerId, typeId)
                .ifPresent(inv -> {
                    inv.setDispatchedQty(inv.getDispatchedQty().add(allocation.getAllocatedQty()));
                    inventoryRepository.save(inv);
                });
    }

    private Dispatch findOrThrow(Long id) {
        return dispatchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispatch not found: " + id));
    }

    /**
     * After delivery, check if the entire relief request is now fully fulfilled
     * and update its status accordingly.
     */
    private void updateRequestStatus(ReliefRequest request) {
        List<RequestItem> allItems = requestItemRepository
                .findByRequest_RequestId(request.getRequestId());

        boolean allFulfilled = allItems.stream()
                .allMatch(i -> i.getStatus() == RequestItem.ItemStatus.FULFILLED);
        boolean anyFulfilled = allItems.stream()
                .anyMatch(i -> i.getStatus() == RequestItem.ItemStatus.FULFILLED
                        || i.getStatus() == RequestItem.ItemStatus.PARTIAL);

        if (allFulfilled) {
            request.setStatus(ReliefRequest.RequestStatus.FULFILLED);
        } else if (anyFulfilled) {
            request.setStatus(ReliefRequest.RequestStatus.PARTIALLY_FULFILLED);
        }
        reliefRequestRepository.save(request);
    }

    private DispatchResponse toResponse(Dispatch d) {
        Allocation a    = d.getAllocation();
        RequestItem item = a.getRequestItem();

        return DispatchResponse.builder()
                .dispatchId(d.getDispatchId())
                .allocationId(a.getAllocationId())
                .requestItemId(item.getRequestItemId())
                .requestId(item.getRequest().getRequestId())
                .resourceTypeName(item.getResourceType().getName())
                .unit(item.getResourceType().getUnit())
                .allocatedQty(a.getAllocatedQty())
                .centerId(a.getCenter().getCenterId())
                .centerName(a.getCenter().getName())
                .locationName(item.getRequest().getLocation().getName())
                .teamId(d.getTeam() != null ? d.getTeam().getTeamId() : null)
                .teamName(d.getTeam() != null ? d.getTeam().getName() : null)
                .vehicleInfo(d.getVehicleInfo())
                .dispatchedAt(d.getDispatchedAt())
                .estimatedArrival(d.getEstimatedArrival())
                .actualArrival(d.getActualArrival())
                .deliveredQty(d.getDeliveredQty())
                .status(d.getStatus().name())
                .createdById(d.getCreatedBy() != null ? d.getCreatedBy().getUserId() : null)
                .createdByName(d.getCreatedBy() != null ? d.getCreatedBy().getName() : null)
                .notes(d.getNotes())
                .build();
    }
}
