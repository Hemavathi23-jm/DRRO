package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "locations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long locationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disaster_id", nullable = false)
    private Disaster disaster;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer populationAffected = 0;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer vulnerabilityScore = 0;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer severityScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "accessibility_type")
    private AccessibilityType accessibility = AccessibilityType.ACCESSIBLE;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer openRequestCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "fulfillment_status")
    private FulfillmentStatus fulfillmentStatus = FulfillmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    public enum AccessibilityType { ACCESSIBLE, DIFFICULT, BLOCKED }
    public enum FulfillmentStatus { PENDING, PARTIAL, FULFILLED }

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
