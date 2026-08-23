package com.drro.service;

import com.drro.dto.request.ResourceCenterRequest;
import com.drro.dto.response.ResourceCenterResponse;
import com.drro.entity.ResourceCenter;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.ResourceCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceCenterService {

    private final ResourceCenterRepository resourceCenterRepository;

    public List<ResourceCenterResponse> getAll() {
        return resourceCenterRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ResourceCenterResponse> getActive() {
        return resourceCenterRepository.findByStatus(ResourceCenter.CenterStatus.ACTIVE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ResourceCenterResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ResourceCenterResponse create(ResourceCenterRequest req) {
        ResourceCenter center = ResourceCenter.builder()
                .name(req.getName())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .address(req.getAddress())
                .contact(req.getContact())
                .status(req.getStatus() != null
                        ? ResourceCenter.CenterStatus.valueOf(req.getStatus().toUpperCase())
                        : ResourceCenter.CenterStatus.ACTIVE)
                .build();
        return toResponse(resourceCenterRepository.save(center));
    }

    @Transactional
    public ResourceCenterResponse update(Long id, ResourceCenterRequest req) {
        ResourceCenter center = findOrThrow(id);
        center.setName(req.getName());
        center.setLatitude(req.getLatitude());
        center.setLongitude(req.getLongitude());
        if (req.getAddress() != null) center.setAddress(req.getAddress());
        if (req.getContact() != null) center.setContact(req.getContact());
        if (req.getStatus() != null)
            center.setStatus(ResourceCenter.CenterStatus.valueOf(req.getStatus().toUpperCase()));
        return toResponse(resourceCenterRepository.save(center));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        resourceCenterRepository.deleteById(id);
    }

    // ---- helpers ---------------------------------------------------------------

    private ResourceCenter findOrThrow(Long id) {
        return resourceCenterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResourceCenter not found: " + id));
    }

    public ResourceCenterResponse toResponse(ResourceCenter c) {
        return ResourceCenterResponse.builder()
                .centerId(c.getCenterId())
                .name(c.getName())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .address(c.getAddress())
                .contact(c.getContact())
                .status(c.getStatus().name())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
