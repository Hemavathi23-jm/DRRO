package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "relief_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReliefRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disaster_id", nullable = false)
    private Disaster disaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "urgency_level")
    private UrgencyLevel urgency;

    private OffsetDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "request_status")
    private RequestStatus status = RequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(updatable = false)
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum UrgencyLevel { LOW, MEDIUM, HIGH, CRITICAL }
    public enum RequestStatus {
        PENDING, VERIFIED, ALLOCATED, PARTIALLY_FULFILLED,
        FULFILLED, ESCALATED, CLOSED
    }

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); updatedAt = OffsetDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
