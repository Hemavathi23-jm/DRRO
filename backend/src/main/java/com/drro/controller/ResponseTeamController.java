package com.drro.controller;

import com.drro.dto.request.ResponseTeamRequest;
import com.drro.dto.request.TeamAssignmentRequest;
import com.drro.dto.response.ResponseTeamResponse;
import com.drro.service.ResponseTeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ResponseTeamController — REST API for response teams and assignments.
 *
 * Base path: /api/teams
 *
 * Endpoints:
 *   GET    /                                    → list all teams
 *   GET    /available                           → list AVAILABLE teams only
 *   GET    /{id}                                → get team by ID
 *   POST   /                                    → create team
 *   PUT    /{id}                                → update team
 *   DELETE /{id}                                → delete team
 *
 *   POST   /assignments                         → assign team to disaster/location
 *   PUT    /assignments/{assignmentId}/status   → update assignment status
 *   GET    /{teamId}/assignments                → assignments for a team
 *   GET    /assignments/disaster/{disasterId}   → assignments for a disaster
 */
@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class ResponseTeamController {

    private final ResponseTeamService responseTeamService;

    // -----------------------------------------------------------------------
    // TEAM CRUD
    // -----------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<List<ResponseTeamResponse>> getAll() {
        return ResponseEntity.ok(responseTeamService.getAll());
    }

    @GetMapping("/available")
    public ResponseEntity<List<ResponseTeamResponse>> getAvailable() {
        return ResponseEntity.ok(responseTeamService.getAvailable());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseTeamResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(responseTeamService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ResponseTeamResponse> create(@RequestBody ResponseTeamRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseTeamService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ResponseTeamResponse> update(
            @PathVariable Long id,
            @RequestBody ResponseTeamRequest req) {
        return ResponseEntity.ok(responseTeamService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        responseTeamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // ASSIGNMENTS
    // -----------------------------------------------------------------------

    /**
     * Assign a team to a disaster / location.
     * POST /api/teams/assignments
     * Body: { "teamId": 1, "disasterId": 2, "locationId": 3, "notes": "..." }
     */
    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ResponseTeamResponse> assign(@RequestBody TeamAssignmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseTeamService.assign(req));
    }

    /**
     * Update assignment status.
     * PUT /api/teams/assignments/{assignmentId}/status
     * Body: { "status": "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }
     */
    @PutMapping("/assignments/{assignmentId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<ResponseTeamResponse> updateAssignmentStatus(
            @PathVariable Long assignmentId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(responseTeamService.updateAssignment(assignmentId, status));
    }

    /**
     * Get all assignments for a specific team.
     * GET /api/teams/{teamId}/assignments
     */
    @GetMapping("/{teamId}/assignments")
    public ResponseEntity<List<ResponseTeamResponse.AssignmentSummary>> getAssignmentsByTeam(
            @PathVariable Long teamId) {
        return ResponseEntity.ok(responseTeamService.getAssignmentsByTeam(teamId));
    }

    /**
     * Get all team assignments for a disaster.
     * GET /api/teams/assignments/disaster/{disasterId}
     */
    @GetMapping("/assignments/disaster/{disasterId}")
    public ResponseEntity<List<ResponseTeamResponse.AssignmentSummary>> getAssignmentsByDisaster(
            @PathVariable Long disasterId) {
        return ResponseEntity.ok(responseTeamService.getAssignmentsByDisaster(disasterId));
    }
}
