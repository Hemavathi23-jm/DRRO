package com.drro.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Response DTO for a ResponseTeam, optionally including its assignment history.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResponseTeamResponse {

    private Long teamId;
    private String name;
    private String skills;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String availability;
    private String contact;
    private OffsetDateTime createdAt;

    /** Current / recent assignments */
    private List<AssignmentSummary> assignments;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AssignmentSummary {
        private Long assignmentId;
        private Long disasterId;
        private String disasterTitle;
        private Long locationId;
        private String locationName;
        private String status;
        private OffsetDateTime assignedAt;
        private OffsetDateTime completedAt;
        private String notes;
    }
}
