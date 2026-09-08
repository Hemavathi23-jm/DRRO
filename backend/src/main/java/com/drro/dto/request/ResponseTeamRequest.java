package com.drro.dto.request;

import lombok.*;
import java.math.BigDecimal;

/**
 * Request DTO for creating or updating a ResponseTeam.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResponseTeamRequest {

    private String name;

    /** Comma-separated skill tags e.g. "medical,rescue,logistics" */
    private String skills;

    private BigDecimal latitude;
    private BigDecimal longitude;

    /** AVAILABLE, DEPLOYED, OFF_DUTY */
    private String availability;

    private String contact;
}
