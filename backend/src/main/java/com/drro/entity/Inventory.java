package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "inventory",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_center_resource",
        columnNames = {"center_id", "resource_type_id"}
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id", nullable = false)
    private ResourceCenter center;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_type_id", nullable = false)
    private ResourceType resourceType;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal availableQty = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal reservedQty = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal dispatchedQty = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal deliveredQty = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    private LocalDate expiryDate;
    private OffsetDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onSave() { lastUpdated = OffsetDateTime.now(); }
}
