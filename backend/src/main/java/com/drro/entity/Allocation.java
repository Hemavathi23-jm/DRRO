package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "allocations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Allocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long allocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_item_id", nullable = false)
    private RequestItem requestItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id", nullable = false)
    private ResourceCenter center;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal allocatedQty;

    @Column(precision = 5, scale = 2)
    private BigDecimal priorityScore;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "allocation_status")
    private AllocationStatus status = AllocationStatus.RECOMMENDED;

    private OffsetDateTime recommendedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private OffsetDateTime approvedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum AllocationStatus {
        RECOMMENDED, APPROVED, REJECTED, MODIFIED, DISPATCHED, DELIVERED
    }

    @PrePersist
    protected void onCreate() { recommendedAt = OffsetDateTime.now(); }
}
