package com.drro.dto.request;

import lombok.*;

/**
 * Request DTO for creating a new user (admin only).
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateUserRequest {
    private String name;
    private String email;
    private String password;
    /** Role name e.g. ADMIN, OFFICER, RESOURCE_MANAGER, FIELD_OPERATOR */
    private String role;
}
