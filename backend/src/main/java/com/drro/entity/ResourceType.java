package com.drro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resource_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResourceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resourceTypeId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "resource_category")
    private ResourceCategory category;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean perishable = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    public enum ResourceCategory {
        FOOD, WATER, MEDICINE, EQUIPMENT, VEHICLE, PERSONNEL, SHELTER, OTHER
    }
}
