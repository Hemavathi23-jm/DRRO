package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "dispatches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dispatchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id", nullable = false)
    private Allocation allocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private ResponseTeam team;

    @Column(length = 200)
    private String vehicleInfo;

    private OffsetDateTime dispatchedAt;
    private OffsetDateTime estimatedArrival;
    private OffsetDateTime actualArrival;

    @Builder.Default
    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal deliveredQty = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "dispatch_status")
    private DispatchStatus status = DispatchStatus.CREATED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum DispatchStatus { CREATED, IN_TRANSIT, DELIVERED, FAILED }
}
