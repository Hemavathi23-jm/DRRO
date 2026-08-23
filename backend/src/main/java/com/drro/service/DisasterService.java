package com.drro.service;

import com.drro.dto.request.DisasterRequest;
import com.drro.dto.response.DisasterResponse;
import com.drro.entity.Disaster;
import com.drro.entity.User;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.DisasterRepository;
import com.drro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisasterService {

    private final DisasterRepository disasterRepository;
    private final UserRepository userRepository;

    public List<DisasterResponse> getAll() {
        return disasterRepository.findAllOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DisasterResponse> getByStatus(String status) {
        Disaster.DisasterStatus s = Disaster.DisasterStatus.valueOf(status.toUpperCase());
        return disasterRepository.findByStatusOrderByCreatedAtDesc(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DisasterResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public DisasterResponse create(DisasterRequest req, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorEmail));

        Disaster disaster = Disaster.builder()
                .title(req.getTitle())
                .type(Disaster.DisasterType.valueOf(req.getType().toUpperCase()))
                .severity(req.getSeverity())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .description(req.getDescription())
                .status(req.getStatus() != null
                        ? Disaster.DisasterStatus.valueOf(req.getStatus().toUpperCase())
                        : Disaster.DisasterStatus.ACTIVE)
                .createdBy(creator)
                .build();

        return toResponse(disasterRepository.save(disaster));
    }

    @Transactional
    public DisasterResponse update(Long id, DisasterRequest req) {
        Disaster disaster = findOrThrow(id);
        disaster.setTitle(req.getTitle());
        disaster.setType(Disaster.DisasterType.valueOf(req.getType().toUpperCase()));
        disaster.setSeverity(req.getSeverity());
        disaster.setStartTime(req.getStartTime());
        disaster.setEndTime(req.getEndTime());
        disaster.setLatitude(req.getLatitude());
        disaster.setLongitude(req.getLongitude());
        disaster.setDescription(req.getDescription());
        if (req.getStatus() != null)
            disaster.setStatus(Disaster.DisasterStatus.valueOf(req.getStatus().toUpperCase()));
        return toResponse(disasterRepository.save(disaster));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        disasterRepository.deleteById(id);
    }

    // ---- helpers ---------------------------------------------------------------

    private Disaster findOrThrow(Long id) {
        return disasterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disaster not found: " + id));
    }

    private DisasterResponse toResponse(Disaster d) {
        return DisasterResponse.builder()
                .disasterId(d.getDisasterId())
                .title(d.getTitle())
                .type(d.getType().name())
                .severity(d.getSeverity())
                .startTime(d.getStartTime())
                .endTime(d.getEndTime())
                .latitude(d.getLatitude())
                .longitude(d.getLongitude())
                .description(d.getDescription())
                .status(d.getStatus().name())
                .createdById(d.getCreatedBy() != null ? d.getCreatedBy().getUserId() : null)
                .createdByName(d.getCreatedBy() != null ? d.getCreatedBy().getName() : null)
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
