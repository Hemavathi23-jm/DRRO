package com.drro.dto.request;

import lombok.*;
import java.time.OffsetDateTime;

/**
 * Request DTO for assigning a ResponseTeam to a disaster + location.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamAssignmentRequest {

    private Long teamId;
    private Long disasterId;
    private Long locationId;

    /** Optional notes about this assignment */
    private String notes;
}
