package com.drro.dto.response;

import lombok.*;
import java.time.OffsetDateTime;

/**
 * Response DTO for User (admin-facing — never exposes password hash).
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
