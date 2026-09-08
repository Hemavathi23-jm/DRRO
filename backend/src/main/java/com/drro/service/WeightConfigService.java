package com.drro.service;

import com.drro.dto.request.WeightConfigRequest;
import com.drro.dto.response.WeightConfigResponse;
import com.drro.entity.User;
import com.drro.entity.WeightConfig;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.UserRepository;
import com.drro.repository.WeightConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WeightConfigService {
    private static final BigDecimal REQUIRED_TOTAL = BigDecimal.ONE;

    private final WeightConfigRepository weightConfigRepository;
    private final UserRepository userRepository;

    public List<WeightConfigResponse> getAll() {
        return weightConfigRepository.findAll().stream().map(this::toResponse).toList();
    }

    public WeightConfigResponse getActive() {
        return toResponse(weightConfigRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ResourceNotFoundException("No active weight configuration found")));
    }

    @Transactional
    public WeightConfigResponse createAndActivate(WeightConfigRequest request, String actorEmail) {
        validateTotal(request);
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorEmail));
        weightConfigRepository.findAll().forEach(config -> config.setIsActive(false));
        WeightConfig saved = weightConfigRepository.save(WeightConfig.builder()
                .configName(request.getConfigName().trim())
                .weightSeverity(request.getWeightSeverity())
                .weightPopulation(request.getWeightPopulation())
                .weightUrgency(request.getWeightUrgency())
                .weightShortage(request.getWeightShortage())
                .weightTravel(request.getWeightTravel())
                .weightVulnerability(request.getWeightVulnerability())
                .isActive(true)
                .createdBy(actor)
                .build());
        return toResponse(saved);
    }

    @Transactional
    public WeightConfigResponse activate(Long configId) {
        WeightConfig selected = weightConfigRepository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("Weight configuration not found: " + configId));
        weightConfigRepository.findAll().forEach(config -> config.setIsActive(false));
        selected.setIsActive(true);
        return toResponse(weightConfigRepository.save(selected));
    }

    private void validateTotal(WeightConfigRequest request) {
        BigDecimal total = request.getWeightSeverity().add(request.getWeightPopulation())
                .add(request.getWeightUrgency()).add(request.getWeightShortage())
                .add(request.getWeightTravel()).add(request.getWeightVulnerability());
        if (total.compareTo(REQUIRED_TOTAL) != 0) {
            throw new IllegalArgumentException("Allocation weights must add up to exactly 1.00; received " + total);
        }
    }

    private WeightConfigResponse toResponse(WeightConfig config) {
        return WeightConfigResponse.builder()
                .configId(config.getConfigId()).configName(config.getConfigName())
                .weightSeverity(config.getWeightSeverity()).weightPopulation(config.getWeightPopulation())
                .weightUrgency(config.getWeightUrgency()).weightShortage(config.getWeightShortage())
                .weightTravel(config.getWeightTravel()).weightVulnerability(config.getWeightVulnerability())
                .active(config.getIsActive()).createdAt(config.getCreatedAt()).build();
    }
}