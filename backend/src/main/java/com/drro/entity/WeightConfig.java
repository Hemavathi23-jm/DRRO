package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "weight_config")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeightConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long configId;

    @Column(nullable = false, length = 100)
    private String configName;

    @Builder.Default
    @Column(precision = 4, scale = 2, columnDefinition = "NUMERIC(4,2) DEFAULT 0.25")
    private BigDecimal weightSeverity = new BigDecimal("0.25");

    @Builder.Default
    @Column(precision = 4, scale = 2, columnDefinition = "NUMERIC(4,2) DEFAULT 0.20")
    private BigDecimal weightPopulation = new BigDecimal("0.20");

    @Builder.Default
    @Column(precision = 4, scale = 2, columnDefinition = "NUMERIC(4,2) DEFAULT 0.20")
    private BigDecimal weightUrgency = new BigDecimal("0.20");

    @Builder.Default
    @Column(precision = 4, scale = 2, columnDefinition = "NUMERIC(4,2) DEFAULT 0.20")
    private BigDecimal weightShortage = new BigDecimal("0.20");

    @Builder.Default
    @Column(precision = 4, scale = 2, columnDefinition = "NUMERIC(4,2) DEFAULT 0.10")
    private BigDecimal weightTravel = new BigDecimal("0.10");

    @Builder.Default
    @Column(precision = 4, scale = 2, columnDefinition = "NUMERIC(4,2) DEFAULT 0.05")
    private BigDecimal weightVulnerability = new BigDecimal("0.05");

    @Builder.Default
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isActive = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
