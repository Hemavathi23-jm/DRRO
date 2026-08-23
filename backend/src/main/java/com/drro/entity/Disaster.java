package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "disasters")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Disaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long disasterId;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "disaster_type")
    private DisasterType type;

    @Column(nullable = false)
    private Integer severity;

    private OffsetDateTime startTime;
    private OffsetDateTime endTime;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "disaster_status")
    private DisasterStatus status = DisasterStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(updatable = false)
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public enum DisasterType { FLOOD, EARTHQUAKE, CYCLONE, LANDSLIDE, WILDFIRE, OTHER }
    public enum DisasterStatus { ACTIVE, CONTAINED, RECOVERING, CLOSED }

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); updatedAt = OffsetDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
