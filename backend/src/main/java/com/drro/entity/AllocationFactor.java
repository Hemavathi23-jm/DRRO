package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "allocation_factors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AllocationFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long factorId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id", nullable = false, unique = true)
    private Allocation allocation;

    @Column(precision = 5, scale = 2)
    private BigDecimal severityScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal populationScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal urgencyScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal shortageScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal travelTimeScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal vulnerabilityScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Column(precision = 8, scale = 2)
    private BigDecimal distanceKm;

    @Column(precision = 6, scale = 2)
    private BigDecimal estimatedTravelHrs;

    @Column(columnDefinition = "TEXT")
    private String explanationText;
}
