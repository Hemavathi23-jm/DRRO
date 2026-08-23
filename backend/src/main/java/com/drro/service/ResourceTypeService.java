package com.drro.service;

import com.drro.dto.request.ResourceTypeRequest;
import com.drro.dto.response.ResourceTypeResponse;
import com.drro.entity.ResourceType;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceTypeService {

    private final ResourceTypeRepository resourceTypeRepository;

    public List<ResourceTypeResponse> getAll() {
        return resourceTypeRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ResourceTypeResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ResourceTypeResponse create(ResourceTypeRequest req) {
        ResourceType rt = ResourceType.builder()
                .name(req.getName())
                .unit(req.getUnit())
                .category(ResourceType.ResourceCategory.valueOf(req.getCategory().toUpperCase()))
                .perishable(req.getPerishable() != null ? req.getPerishable() : false)
                .description(req.getDescription())
                .build();
        return toResponse(resourceTypeRepository.save(rt));
    }

    @Transactional
    public ResourceTypeResponse update(Long id, ResourceTypeRequest req) {
        ResourceType rt = findOrThrow(id);
        rt.setName(req.getName());
        rt.setUnit(req.getUnit());
        rt.setCategory(ResourceType.ResourceCategory.valueOf(req.getCategory().toUpperCase()));
        if (req.getPerishable() != null) rt.setPerishable(req.getPerishable());
        if (req.getDescription() != null) rt.setDescription(req.getDescription());
        return toResponse(resourceTypeRepository.save(rt));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        resourceTypeRepository.deleteById(id);
    }

    // ---- helpers ---------------------------------------------------------------

    private ResourceType findOrThrow(Long id) {
        return resourceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResourceType not found: " + id));
    }

    public ResourceTypeResponse toResponse(ResourceType rt) {
        return ResourceTypeResponse.builder()
                .resourceTypeId(rt.getResourceTypeId())
                .name(rt.getName())
                .unit(rt.getUnit())
                .category(rt.getCategory().name())
                .perishable(rt.getPerishable())
                .description(rt.getDescription())
                .build();
    }
}
