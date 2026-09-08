package com.drro.service;

import com.drro.dto.request.ResponseTeamRequest;
import com.drro.dto.request.TeamAssignmentRequest;
import com.drro.dto.response.ResponseTeamResponse;
import com.drro.entity.*;
import com.drro.exception.ResourceNotFoundException;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ResponseTeamService — manages response teams and their assignments.
 *
 * Responsibilities:
 *  - CRUD for ResponseTeam
 *  - Assign team to a disaster / location (TeamAssignment)
 *  - Update assignment status (IN_PROGRESS, COMPLETED, CANCELLED)
 *  - Query available teams
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResponseTeamService {

    private final ResponseTeamRepository    responseTeamRepository;
    private final TeamAssignmentRepository  teamAssignmentRepository;
    private final DisasterRepository        disasterRepository;
    private final LocationRepository        locationRepository;

    // -----------------------------------------------------------------------
    // RESPONSE TEAM CRUD
    // -----------------------------------------------------------------------

    public List<ResponseTeamResponse> getAll() {
        return responseTeamRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ResponseTeamResponse getById(Long id) {
        return toResponse(findTeamOrThrow(id));
    }

    public List<ResponseTeamResponse> getAvailable() {
        return responseTeamRepository
                .findByAvailability(ResponseTeam.TeamAvailability.AVAILABLE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ResponseTeamResponse create(ResponseTeamRequest req) {
        ResponseTeam team = ResponseTeam.builder()
                .name(req.getName())
                .skills(req.getSkills())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .availability(req.getAvailability() != null
                        ? ResponseTeam.TeamAvailability.valueOf(req.getAvailability().toUpperCase())
                        : ResponseTeam.TeamAvailability.AVAILABLE)
                .contact(req.getContact())
                .build();
        ResponseTeam saved = responseTeamRepository.save(team);
        log.info("[ResponseTeamService] Team '{}' created with id {}.", saved.getName(), saved.getTeamId());
        return toResponse(saved);
    }

    @Transactional
    public ResponseTeamResponse update(Long id, ResponseTeamRequest req) {
        ResponseTeam team = findTeamOrThrow(id);
        if (req.getName()         != null) team.setName(req.getName());
        if (req.getSkills()       != null) team.setSkills(req.getSkills());
        if (req.getLatitude()     != null) team.setLatitude(req.getLatitude());
        if (req.getLongitude()    != null) team.setLongitude(req.getLongitude());
        if (req.getContact()      != null) team.setContact(req.getContact());
        if (req.getAvailability() != null) {
            team.setAvailability(
                    ResponseTeam.TeamAvailability.valueOf(req.getAvailability().toUpperCase()));
        }
        return toResponse(responseTeamRepository.save(team));
    }

    @Transactional
    public void delete(Long id) {
        findTeamOrThrow(id);
        responseTeamRepository.deleteById(id);
        log.info("[ResponseTeamService] Team {} deleted.", id);
    }

    // -----------------------------------------------------------------------
    // TEAM ASSIGNMENTS
    // -----------------------------------------------------------------------

    /**
     * Assign a team to a disaster / location.
     * Automatically marks the team as DEPLOYED.
     */
    @Transactional
    public ResponseTeamResponse assign(TeamAssignmentRequest req) {
        ResponseTeam team = findTeamOrThrow(req.getTeamId());

        Disaster disaster = req.getDisasterId() != null
                ? disasterRepository.findById(req.getDisasterId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Disaster not found: " + req.getDisasterId()))
                : null;

        Location location = req.getLocationId() != null
                ? locationRepository.findById(req.getLocationId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Location not found: " + req.getLocationId()))
                : null;

        TeamAssignment assignment = TeamAssignment.builder()
                .team(team)
                .disaster(disaster)
                .location(location)
                .status(TeamAssignment.AssignmentStatus.ASSIGNED)
                .notes(req.getNotes())
                .build();
        teamAssignmentRepository.save(assignment);

        // Mark team as DEPLOYED
        team.setAvailability(ResponseTeam.TeamAvailability.DEPLOYED);
        responseTeamRepository.save(team);

        log.info("[ResponseTeamService] Team '{}' assigned to disaster {} / location {}.",
                team.getName(), req.getDisasterId(), req.getLocationId());
        return toResponse(team);
    }

    /**
     * Update assignment status.
     * When COMPLETED or CANCELLED → mark team AVAILABLE again.
     */
    @Transactional
    public ResponseTeamResponse updateAssignment(Long assignmentId, String newStatus) {
        TeamAssignment assignment = teamAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TeamAssignment not found: " + assignmentId));

        TeamAssignment.AssignmentStatus status =
                TeamAssignment.AssignmentStatus.valueOf(newStatus.toUpperCase());
        assignment.setStatus(status);

        if (status == TeamAssignment.AssignmentStatus.COMPLETED
                || status == TeamAssignment.AssignmentStatus.CANCELLED) {
            assignment.setCompletedAt(OffsetDateTime.now());
            // Release team back to available
            ResponseTeam team = assignment.getTeam();
            team.setAvailability(ResponseTeam.TeamAvailability.AVAILABLE);
            responseTeamRepository.save(team);
            log.info("[ResponseTeamService] Team '{}' released back to AVAILABLE.", team.getName());
        }

        teamAssignmentRepository.save(assignment);
        return toResponse(assignment.getTeam());
    }

    /**
     * Get all assignments for a team.
     */
    public List<ResponseTeamResponse.AssignmentSummary> getAssignmentsByTeam(Long teamId) {
        findTeamOrThrow(teamId);
        return teamAssignmentRepository.findByTeam_TeamId(teamId)
                .stream().map(this::toAssignmentSummary).collect(Collectors.toList());
    }

    /**
     * Get all assignments for a disaster.
     */
    public List<ResponseTeamResponse.AssignmentSummary> getAssignmentsByDisaster(Long disasterId) {
        return teamAssignmentRepository.findByDisaster_DisasterId(disasterId)
                .stream().map(this::toAssignmentSummary).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // PRIVATE HELPERS
    // -----------------------------------------------------------------------

    private ResponseTeam findTeamOrThrow(Long id) {
        return responseTeamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResponseTeam not found: " + id));
    }

    private ResponseTeamResponse toResponse(ResponseTeam t) {
        List<ResponseTeamResponse.AssignmentSummary> assignments =
                teamAssignmentRepository.findByTeam_TeamId(t.getTeamId())
                        .stream().map(this::toAssignmentSummary).collect(Collectors.toList());

        return ResponseTeamResponse.builder()
                .teamId(t.getTeamId())
                .name(t.getName())
                .skills(t.getSkills())
                .latitude(t.getLatitude())
                .longitude(t.getLongitude())
                .availability(t.getAvailability().name())
                .contact(t.getContact())
                .createdAt(t.getCreatedAt())
                .assignments(assignments)
                .build();
    }

    private ResponseTeamResponse.AssignmentSummary toAssignmentSummary(TeamAssignment a) {
        return ResponseTeamResponse.AssignmentSummary.builder()
                .assignmentId(a.getAssignmentId())
                .disasterId(a.getDisaster() != null ? a.getDisaster().getDisasterId() : null)
                .disasterTitle(a.getDisaster() != null ? a.getDisaster().getTitle() : null)
                .locationId(a.getLocation() != null ? a.getLocation().getLocationId() : null)
                .locationName(a.getLocation() != null ? a.getLocation().getName() : null)
                .status(a.getStatus().name())
                .assignedAt(a.getAssignedAt())
                .completedAt(a.getCompletedAt())
                .notes(a.getNotes())
                .build();
    }
}
