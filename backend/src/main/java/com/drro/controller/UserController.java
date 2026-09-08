package com.drro.controller;

import com.drro.dto.request.CreateUserRequest;
import com.drro.dto.response.UserResponse;
import com.drro.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * UserController — Admin-only user management.
 *
 * Base path: /api/users
 *
 * GET    /                    → list all users
 * GET    /{id}                → get user by ID
 * POST   /                    → create user
 * PUT    /{id}/role           → update user role
 * DELETE /{id}/deactivate     → deactivate user
 * PUT    /{id}/activate       → reactivate user
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody CreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(req));
    }

    /**
     * Update user role.
     * PUT /api/users/{id}/role
     * Body: { "role": "OFFICER" }
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateRole(id, body.get("role")));
    }

    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deactivate(id));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(userService.activate(id));
    }
}
