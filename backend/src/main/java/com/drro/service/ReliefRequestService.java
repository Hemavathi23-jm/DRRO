package com.drro.service;

import com.drro.dto.request.ReliefRequestRequest;
import com.drro.dto.response.ReliefRequestResponse;
import com.drro.entity.*;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReliefRequestService {

    private final ReliefRequestRepository requestRepository;
    private final RequestItemRepository requestItemRepository;
    private final DisasterRepository disasterRepository;
    private final LocationRepository locationRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final UserRepository userRepository;

    /** All requests for a disaster */
    public List<ReliefRequestResponse> getByDisaster(Long disasterId) {
        return requestRepository.findByDisaster_DisasterIdOrderByCreatedAtDesc(disasterId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** All requests by status */
    public List<ReliefRequestResponse> getByStatus(String status) {
        ReliefRequest.RequestStatus s = ReliefRequest.RequestStatus.valueOf(status.toUpperCase());
        return requestRepository.findByStatus(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Single request with items */
    public ReliefRequestResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    /** Create relief request + its items in one transaction */
    @Transactional
    public ReliefRequestResponse create(ReliefRequestRequest req, String creatorEmail) {
        Disaster disaster = disasterRepository.findById(req.getDisasterId())
                .orElseThrow(() -> new ResourceNotFoundException("Disaster not found: " + req.getDisasterId()));
        Location location = locationRepository.findById(req.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + req.getLocationId()));
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorEmail));

        ReliefRequest reliefRequest = ReliefRequest.builder()
                .disaster(disaster)
                .location(location)
                .urgency(ReliefRequest.UrgencyLevel.valueOf(req.getUrgency().toUpperCase()))
                .deadline(req.getDeadline())
                .notes(req.getNotes())
                .status(ReliefRequest.RequestStatus.PENDING)
                .createdBy(creator)
                .build();

        ReliefRequest saved = requestRepository.save(reliefRequest);

        // Save all request items
        for (ReliefRequestRequest.RequestItemDto itemDto : req.getItems()) {
            ResourceType resourceType = resourceTypeRepository.findById(itemDto.getResourceTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("ResourceType not found: " + itemDto.getResourceTypeId()));

            RequestItem item = RequestItem.builder()
                    .request(saved)
                    .resourceType(resourceType)
                    .requiredQty(itemDto.getRequiredQty())
                    .fulfilledQty(BigDecimal.ZERO)
                    .status(RequestItem.ItemStatus.OPEN)
                    .build();
            requestItemRepository.save(item);
        }

        // Update open request count on location
        location.setOpenRequestCount(location.getOpenRequestCount() + 1);
        locationRepository.save(location);

        return toResponse(requestRepository.findById(saved.getRequestId()).orElse(saved));
    }

    /** Officer verifies a request */
    @Transactional
    public ReliefRequestResponse verify(Long id, String officerEmail) {
        ReliefRequest request = findOrThrow(id);
        User officer = userRepository.findByEmail(officerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + officerEmail));
        request.setStatus(ReliefRequest.RequestStatus.VERIFIED);
        request.setVerifiedBy(officer);
        return toResponse(requestRepository.save(request));
    }

    /** Update urgency / deadline / notes */
    @Transactional
    public ReliefRequestResponse update(Long id, ReliefRequestRequest req) {
        ReliefRequest request = findOrThrow(id);
        request.setUrgency(ReliefRequest.UrgencyLevel.valueOf(req.getUrgency().toUpperCase()));
        if (req.getDeadline() != null) request.setDeadline(req.getDeadline());
        if (req.getNotes() != null) request.setNotes(req.getNotes());
        return toResponse(requestRepository.save(request));
    }

    // ---- helpers ---------------------------------------------------------------

    private ReliefRequest findOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReliefRequest not found: " + id));
    }

    private ReliefRequestResponse toResponse(ReliefRequest r) {
        List<ReliefRequestResponse.RequestItemResponse> items =
                requestItemRepository.findByRequest_RequestId(r.getRequestId())
                        .stream().map(i -> ReliefRequestResponse.RequestItemResponse.builder()
                                .requestItemId(i.getRequestItemId())
                                .resourceTypeId(i.getResourceType().getResourceTypeId())
                                .resourceTypeName(i.getResourceType().getName())
                                .unit(i.getResourceType().getUnit())
                                .requiredQty(i.getRequiredQty())
                                .fulfilledQty(i.getFulfilledQty())
                                .unmetQty(i.getUnmetQty())
                                .priorityScore(i.getPriorityScore())
                                .status(i.getStatus().name())
                                .build())
                        .collect(Collectors.toList());

        return ReliefRequestResponse.builder()
                .requestId(r.getRequestId())
                .disasterId(r.getDisaster().getDisasterId())
                .disasterTitle(r.getDisaster().getTitle())
                .locationId(r.getLocation().getLocationId())
                .locationName(r.getLocation().getName())
                .urgency(r.getUrgency().name())
                .deadline(r.getDeadline())
                .status(r.getStatus().name())
                .createdById(r.getCreatedBy() != null ? r.getCreatedBy().getUserId() : null)
                .createdByName(r.getCreatedBy() != null ? r.getCreatedBy().getName() : null)
                .verifiedById(r.getVerifiedBy() != null ? r.getVerifiedBy().getUserId() : null)
                .verifiedByName(r.getVerifiedBy() != null ? r.getVerifiedBy().getName() : null)
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .items(items)
                .build();
    }
}
