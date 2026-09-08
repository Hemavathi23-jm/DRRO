package com.drro.service;

import com.drro.dto.request.CreateUserRequest;
import com.drro.dto.response.UserResponse;
import com.drro.entity.Role;
import com.drro.entity.User;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.RoleRepository;
import com.drro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * UserService — Admin-only user management.
 * Handles create, list, update, activate/deactivate.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository  userRepository;
    private final RoleRepository  roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAll() {
        return userRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public UserResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + req.getEmail());
        }
        Role role = roleRepository.findByRoleName(req.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + req.getRole()));

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .status(User.UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        log.info("[UserService] Created user '{}' with role '{}'.", saved.getEmail(), role.getRoleName());
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateRole(Long id, String roleName) {
        User user = findOrThrow(id);
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
        user.setRole(role);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse deactivate(Long id) {
        User user = findOrThrow(id);
        user.setStatus(User.UserStatus.INACTIVE);
        log.info("[UserService] Deactivated user '{}'.", user.getEmail());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse activate(Long id) {
        User user = findOrThrow(id);
        user.setStatus(User.UserStatus.ACTIVE);
        log.info("[UserService] Activated user '{}'.", user.getEmail());
        return toResponse(userRepository.save(user));
    }

    // ---- helpers ---------------------------------------------------------------

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole().getRoleName())
                .status(u.getStatus().name())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
