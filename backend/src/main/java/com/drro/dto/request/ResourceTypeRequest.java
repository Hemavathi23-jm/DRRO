package com.drro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ResourceTypeRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Unit is required")
    @Size(max = 50)
    private String unit;

    @NotBlank(message = "Category is required")
    private String category; // FOOD, WATER, MEDICINE, EQUIPMENT, VEHICLE, PERSONNEL, SHELTER, OTHER

    private Boolean perishable = false;

    private String description;
}
