package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "request_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ReliefRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_type_id", nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal requiredQty;

    @Builder.Default
    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal fulfilledQty = BigDecimal.ZERO;

    // unmet_qty is a generated column in DB — map as insertable=false, updatable=false
    @Column(precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal unmetQty;

    @Column(precision = 5, scale = 2)
    private BigDecimal priorityScore;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "item_status")
    private ItemStatus status = ItemStatus.OPEN;

    public enum ItemStatus { OPEN, PARTIAL, FULFILLED }
}
