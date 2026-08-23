package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "team_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private ResponseTeam team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disaster_id")
    private Disaster disaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(updatable = false)
    private OffsetDateTime assignedAt;

    private OffsetDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "assignment_status")
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum AssignmentStatus { ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED }

    @PrePersist
    protected void onCreate() { assignedAt = OffsetDateTime.now(); }
}
