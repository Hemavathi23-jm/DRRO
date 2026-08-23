package com.drro.service;

import com.drro.dto.request.InventoryRequest;
import com.drro.dto.response.InventoryResponse;
import com.drro.entity.Inventory;
import com.drro.entity.ResourceCenter;
import com.drro.entity.ResourceType;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.InventoryRepository;
import com.drro.repository.ResourceCenterRepository;
import com.drro.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ResourceCenterRepository centerRepository;
    private final ResourceTypeRepository resourceTypeRepository;

    /** All inventory records for a center */
    public List<InventoryResponse> getByCenter(Long centerId) {
        return inventoryRepository.findByCenter_CenterId(centerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Single inventory record */
    public InventoryResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    /** All inventory with available stock for a resource type */
    public List<InventoryResponse> getAvailableByResourceType(Long resourceTypeId) {
        return inventoryRepository.findAvailableByResourceType(resourceTypeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Create or update inventory record (upsert by center + resource type) */
    @Transactional
    public InventoryResponse upsert(InventoryRequest req) {
        ResourceCenter center = centerRepository.findById(req.getCenterId())
                .orElseThrow(() -> new ResourceNotFoundException("Center not found: " + req.getCenterId()));
        ResourceType resourceType = resourceTypeRepository.findById(req.getResourceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("ResourceType not found: " + req.getResourceTypeId()));

        Inventory inventory = inventoryRepository
                .findByCenter_CenterIdAndResourceType_ResourceTypeId(req.getCenterId(), req.getResourceTypeId())
                .orElse(Inventory.builder()
                        .center(center)
                        .resourceType(resourceType)
                        .reservedQty(BigDecimal.ZERO)
                        .dispatchedQty(BigDecimal.ZERO)
                        .deliveredQty(BigDecimal.ZERO)
                        .build());

        inventory.setAvailableQty(req.getAvailableQty());
        if (req.getMinStockLevel() != null) inventory.setMinStockLevel(req.getMinStockLevel());
        if (req.getExpiryDate() != null) inventory.setExpiryDate(req.getExpiryDate());

        return toResponse(inventoryRepository.save(inventory));
    }

    /** Adjust available quantity (+/-) */
    @Transactional
    public InventoryResponse adjustQty(Long id, BigDecimal delta) {
        Inventory inv = findOrThrow(id);
        BigDecimal newQty = inv.getAvailableQty().add(delta);
        if (newQty.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalStateException("Insufficient inventory — cannot go below 0");
        inv.setAvailableQty(newQty);
        return toResponse(inventoryRepository.save(inv));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        inventoryRepository.deleteById(id);
    }

    // ---- helpers ---------------------------------------------------------------

    private Inventory findOrThrow(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found: " + id));
    }

    public InventoryResponse toResponse(Inventory inv) {
        boolean below = inv.getMinStockLevel() != null
                && inv.getAvailableQty().compareTo(inv.getMinStockLevel()) < 0;
        return InventoryResponse.builder()
                .inventoryId(inv.getInventoryId())
                .centerId(inv.getCenter().getCenterId())
                .centerName(inv.getCenter().getName())
                .resourceTypeId(inv.getResourceType().getResourceTypeId())
                .resourceTypeName(inv.getResourceType().getName())
                .unit(inv.getResourceType().getUnit())
                .availableQty(inv.getAvailableQty())
                .reservedQty(inv.getReservedQty())
                .dispatchedQty(inv.getDispatchedQty())
                .deliveredQty(inv.getDeliveredQty())
                .minStockLevel(inv.getMinStockLevel())
                .expiryDate(inv.getExpiryDate())
                .lastUpdated(inv.getLastUpdated())
                .belowMinStock(below)
                .build();
    }
}
