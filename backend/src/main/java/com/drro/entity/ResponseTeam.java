package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "response_teams")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResponseTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long teamId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "team_availability")
    private TeamAvailability availability = TeamAvailability.AVAILABLE;

    @Column(length = 100)
    private String contact;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    public enum TeamAvailability { AVAILABLE, DEPLOYED, OFF_DUTY }

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
