package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "resource_centers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResourceCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long centerId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String contact;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "center_status")
    private CenterStatus status = CenterStatus.ACTIVE;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    public enum CenterStatus { ACTIVE, INACTIVE }

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
