package com.drro.service;

import com.drro.dto.request.WeightConfigRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertThrows;

class WeightConfigServiceTest {
    @Test
    void rejectsWeightsThatDoNotAddToOne() {
        WeightConfigRequest request = new WeightConfigRequest();
        request.setConfigName("Invalid");
        request.setWeightSeverity(new BigDecimal("0.25"));
        request.setWeightPopulation(new BigDecimal("0.20"));
        request.setWeightUrgency(new BigDecimal("0.20"));
        request.setWeightShortage(new BigDecimal("0.20"));
        request.setWeightTravel(new BigDecimal("0.10"));
        request.setWeightVulnerability(new BigDecimal("0.10"));

        WeightConfigService service = new WeightConfigService(null, null);
        assertThrows(IllegalArgumentException.class, () -> service.createAndActivate(request, "admin@drro.test"));
    }
}