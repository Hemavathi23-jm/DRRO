package com.drro.config;

import com.drro.entity.*;
import com.drro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Seeds demo users and sample operational data when the database is empty.
 * Safe for shared DBs: only inserts missing users / empty-table demo content.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DevDataSeeder {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResourceTypeRepository resourceTypeRepository;
    private final ResourceCenterRepository resourceCenterRepository;
    private final InventoryRepository inventoryRepository;
    private final DisasterRepository disasterRepository;
    private final LocationRepository locationRepository;
    private final ReliefRequestRepository reliefRequestRepository;
    private final RequestItemRepository requestItemRepository;
    private final ResponseTeamRepository responseTeamRepository;
    private final WeightConfigRepository weightConfigRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;


    private static final String DEMO_PASSWORD = "Admin@123";

    private static final List<String> ROLES = List.of(
            "ADMIN", "OFFICER", "RESOURCE_MANAGER", "COORDINATOR", "FIELD_OPERATOR", "VIEWER");

    private static final Map<String, String> DEMO_USERS = Map.of(
            "admin@drro.com", "ADMIN",
            "officer@drro.com", "OFFICER",
            "manager@drro.com", "RESOURCE_MANAGER",
            "field@drro.com", "FIELD_OPERATOR");

    @Order(1)
    @EventListener(ApplicationReadyEvent.class)
    public void seedAll() {
        syncSequences();
        runTransactionalSeed();
    }

    @Transactional
    public void runTransactionalSeed() {
        seedDemoUsers();
        seedResourceTypes();
        seedWeightConfig();
        seedCentersAndInventory();
        seedTeams();
        seedDemoOperationsIfEmpty();
        log.info("[DevDataSeeder] Ready — disasters={}, resources={}, centers={}, requests={}",
                disasterRepository.count(),
                resourceTypeRepository.count(),
                resourceCenterRepository.count(),
                reliefRequestRepository.count());
    }

    public void syncSequences() {
        List<String[]> tables = List.of(
                new String[]{"notifications", "notification_id"},
                new String[]{"sms_logs", "sms_id"},
                new String[]{"relief_requests", "request_id"},
                new String[]{"request_items", "request_item_id"},
                new String[]{"allocations", "allocation_id"},
                new String[]{"dispatches", "dispatch_id"},
                new String[]{"locations", "location_id"},
                new String[]{"disasters", "disaster_id"},
                new String[]{"inventory", "inventory_id"},
                new String[]{"response_teams", "team_id"},
                new String[]{"resource_centers", "center_id"},
                new String[]{"resource_types", "resource_type_id"},
                new String[]{"users", "user_id"},
                new String[]{"audit_logs", "log_id"}
        );

        for (String[] t : tables) {
            try {
                String table = t[0];
                String col = t[1];
                String sql = String.format(
                        "SELECT setval(pg_get_serial_sequence('%s', '%s'), COALESCE((SELECT MAX(%s) FROM %s), 0) + 1, false)",
                        table, col, col, table
                );
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                log.debug("[SequenceSync] Sequence sync note for {}: {}", t[0], e.getMessage());
            }
        }
        log.info("[SequenceSync] PostgreSQL database sequences synchronized successfully.");
    }



    private void seedDemoUsers() {
        ROLES.forEach(r -> roleRepository.findByRoleName(r).orElseGet(() ->
                roleRepository.save(Role.builder().roleName(r).build())));

        DEMO_USERS.forEach((email, roleName) -> {
            Role role = roleRepository.findByRoleName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Role missing: " + roleName));
            userRepository.findByEmail(email).ifPresentOrElse(
                    user -> {
                        user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
                        userRepository.save(user);
                    },
                    () -> userRepository.save(User.builder()
                            .name(capitalizeRole(roleName))
                            .email(email)
                            .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                            .role(role)
                            .status(User.UserStatus.ACTIVE)
                            .build()));
        });
    }

    private void seedResourceTypes() {
        if (resourceTypeRepository.count() > 0) return;

        List.of(
                type("Drinking Water", "Litres", ResourceType.ResourceCategory.WATER, false),
                type("Ready-to-Eat Meals", "Packets", ResourceType.ResourceCategory.FOOD, true),
                type("First Aid Kits", "Kits", ResourceType.ResourceCategory.MEDICINE, false),
                type("Emergency Shelters", "Units", ResourceType.ResourceCategory.SHELTER, false),
                type("Rescue Boats", "Units", ResourceType.ResourceCategory.VEHICLE, false),
                type("Blankets", "Units", ResourceType.ResourceCategory.OTHER, false)
        ).forEach(resourceTypeRepository::save);

        log.info("[DevDataSeeder] Seeded demo resource types");
    }

    private ResourceType type(String name, String unit, ResourceType.ResourceCategory category, boolean perishable) {
        return ResourceType.builder()
                .name(name)
                .unit(unit)
                .category(category)
                .perishable(perishable)
                .description("Demo resource type for DRRO presentations")
                .build();
    }

    private void seedWeightConfig() {
        if (weightConfigRepository.count() > 0) return;
        User admin = userRepository.findByEmail("admin@drro.com").orElse(null);
        weightConfigRepository.save(WeightConfig.builder()
                .configName("Default Priority Weights")
                .isActive(true)
                .createdBy(admin)
                .build());
        log.info("[DevDataSeeder] Seeded default weight config");
    }

    private void seedCentersAndInventory() {
        if (resourceCenterRepository.count() > 0) return;

        ResourceCenter kochi = resourceCenterRepository.save(ResourceCenter.builder()
                .name("Kochi Central Warehouse")
                .latitude(new BigDecimal("9.9312000"))
                .longitude(new BigDecimal("76.2673000"))
                .address("Ernakulam, Kerala")
                .contact("+91-484-100200")
                .status(ResourceCenter.CenterStatus.ACTIVE)
                .build());

        ResourceCenter calicut = resourceCenterRepository.save(ResourceCenter.builder()
                .name("Calicut Relief Depot")
                .latitude(new BigDecimal("11.2588000"))
                .longitude(new BigDecimal("75.7804000"))
                .address("Kozhikode, Kerala")
                .contact("+91-495-100300")
                .status(ResourceCenter.CenterStatus.ACTIVE)
                .build());

        List<ResourceType> types = resourceTypeRepository.findAll();
        BigDecimal[] kochiQty = {
                new BigDecimal("50000"), new BigDecimal("12000"), new BigDecimal("800"),
                new BigDecimal("120"), new BigDecimal("18"), new BigDecimal("4000")
        };
        BigDecimal[] calicutQty = {
                new BigDecimal("28000"), new BigDecimal("7500"), new BigDecimal("450"),
                new BigDecimal("60"), new BigDecimal("10"), new BigDecimal("2200")
        };

        for (int i = 0; i < types.size(); i++) {
            inventoryRepository.save(Inventory.builder()
                    .center(kochi)
                    .resourceType(types.get(i))
                    .availableQty(kochiQty[i % kochiQty.length])
                    .minStockLevel(kochiQty[i % kochiQty.length].multiply(new BigDecimal("0.15")))
                    .build());
            inventoryRepository.save(Inventory.builder()
                    .center(calicut)
                    .resourceType(types.get(i))
                    .availableQty(calicutQty[i % calicutQty.length])
                    .minStockLevel(calicutQty[i % calicutQty.length].multiply(new BigDecimal("0.15")))
                    .build());
        }
        log.info("[DevDataSeeder] Seeded resource centers + inventory");
    }

    private void seedTeams() {
        if (responseTeamRepository.count() > 0) return;

        responseTeamRepository.save(ResponseTeam.builder()
                .name("Alpha Rescue Unit")
                .skills("Search & rescue, first aid, boat ops")
                .latitude(new BigDecimal("10.0150000"))
                .longitude(new BigDecimal("76.3400000"))
                .availability(ResponseTeam.TeamAvailability.AVAILABLE)
                .contact("+91-90000-11111")
                .build());
        responseTeamRepository.save(ResponseTeam.builder()
                .name("Medical Response Team")
                .skills("Trauma care, triage, ambulance")
                .latitude(new BigDecimal("11.2500000"))
                .longitude(new BigDecimal("75.7800000"))
                .availability(ResponseTeam.TeamAvailability.AVAILABLE)
                .contact("+91-90000-22222")
                .build());
        responseTeamRepository.save(ResponseTeam.builder()
                .name("Logistics Convoy B")
                .skills("Heavy transport, warehouse ops")
                .latitude(new BigDecimal("9.9800000"))
                .longitude(new BigDecimal("76.2800000"))
                .availability(ResponseTeam.TeamAvailability.DEPLOYED)
                .contact("+91-90000-33333")
                .build());
        log.info("[DevDataSeeder] Seeded response teams");
    }

    /**
     * Only when there are zero disasters — fills a fresh/empty database with demo incidents.
     */
    private void seedDemoOperationsIfEmpty() {
        if (disasterRepository.count() > 0) {
            log.info("[DevDataSeeder] Disasters already present — skipping demo incident seed");
            return;
        }

        User admin = userRepository.findByEmail("admin@drro.com").orElse(null);
        List<ResourceType> types = resourceTypeRepository.findAll();
        if (types.isEmpty()) return;

        Disaster flood = disasterRepository.save(Disaster.builder()
                .title("Kerala Monsoon Floods 2026 (Demo)")
                .type(Disaster.DisasterType.FLOOD)
                .severity(78)
                .startTime(OffsetDateTime.now().minusDays(2))
                .latitude(new BigDecimal("10.8505000"))
                .longitude(new BigDecimal("76.2711000"))
                .description("Heavy rainfall caused flooding across low-lying districts. Demo dataset for presentations.")
                .status(Disaster.DisasterStatus.ACTIVE)
                .createdBy(admin)
                .build());

        Disaster quake = disasterRepository.save(Disaster.builder()
                .title("Coastal Earthquake Drill (Demo)")
                .type(Disaster.DisasterType.EARTHQUAKE)
                .severity(62)
                .startTime(OffsetDateTime.now().minusHours(18))
                .latitude(new BigDecimal("11.2588000"))
                .longitude(new BigDecimal("75.7804000"))
                .description("Simulated earthquake response scenario for DRRO allocation testing.")
                .status(Disaster.DisasterStatus.ACTIVE)
                .createdBy(admin)
                .build());

        Location wayanad = locationRepository.save(Location.builder()
                .disaster(flood)
                .name("Wayanad North")
                .latitude(new BigDecimal("11.6854000"))
                .longitude(new BigDecimal("76.1320000"))
                .populationAffected(12500)
                .vulnerabilityScore(80)
                .severityScore(75)
                .accessibility(Location.AccessibilityType.DIFFICULT)
                .openRequestCount(2)
                .notes("Road access partially blocked")
                .build());

        Location alappuzha = locationRepository.save(Location.builder()
                .disaster(flood)
                .name("Alappuzha Backwaters")
                .latitude(new BigDecimal("9.4981000"))
                .longitude(new BigDecimal("76.3388000"))
                .populationAffected(8200)
                .vulnerabilityScore(70)
                .severityScore(68)
                .accessibility(Location.AccessibilityType.ACCESSIBLE)
                .openRequestCount(1)
                .build());

        Location kozhikode = locationRepository.save(Location.builder()
                .disaster(quake)
                .name("Kozhikode Beach Ward")
                .latitude(new BigDecimal("11.2588000"))
                .longitude(new BigDecimal("75.7804000"))
                .populationAffected(5400)
                .vulnerabilityScore(55)
                .severityScore(60)
                .accessibility(Location.AccessibilityType.ACCESSIBLE)
                .openRequestCount(1)
                .build());

        ReliefRequest r1 = reliefRequestRepository.save(ReliefRequest.builder()
                .disaster(flood)
                .location(wayanad)
                .urgency(ReliefRequest.UrgencyLevel.CRITICAL)
                .deadline(OffsetDateTime.now().plusHours(12))
                .status(ReliefRequest.RequestStatus.VERIFIED)
                .createdBy(admin)
                .verifiedBy(admin)
                .notes("Urgent drinking water and shelter needed")
                .build());

        ReliefRequest r2 = reliefRequestRepository.save(ReliefRequest.builder()
                .disaster(flood)
                .location(alappuzha)
                .urgency(ReliefRequest.UrgencyLevel.HIGH)
                .deadline(OffsetDateTime.now().plusDays(1))
                .status(ReliefRequest.RequestStatus.PENDING)
                .createdBy(admin)
                .notes("Food packets for stranded families")
                .build());

        ReliefRequest r3 = reliefRequestRepository.save(ReliefRequest.builder()
                .disaster(quake)
                .location(kozhikode)
                .urgency(ReliefRequest.UrgencyLevel.HIGH)
                .deadline(OffsetDateTime.now().plusHours(20))
                .status(ReliefRequest.RequestStatus.PENDING)
                .createdBy(admin)
                .notes("Medical kits for triage camp")
                .build());

        requestItemRepository.save(RequestItem.builder()
                .request(r1)
                .resourceType(types.get(0))
                .requiredQty(new BigDecimal("8000"))
                .priorityScore(new BigDecimal("88.50"))
                .build());
        requestItemRepository.save(RequestItem.builder()
                .request(r1)
                .resourceType(types.size() > 3 ? types.get(3) : types.get(0))
                .requiredQty(new BigDecimal("40"))
                .priorityScore(new BigDecimal("82.00"))
                .build());
        requestItemRepository.save(RequestItem.builder()
                .request(r2)
                .resourceType(types.size() > 1 ? types.get(1) : types.get(0))
                .requiredQty(new BigDecimal("2500"))
                .priorityScore(new BigDecimal("74.00"))
                .build());
        requestItemRepository.save(RequestItem.builder()
                .request(r3)
                .resourceType(types.size() > 2 ? types.get(2) : types.get(0))
                .requiredQty(new BigDecimal("120"))
                .priorityScore(new BigDecimal("79.00"))
                .build());

        log.info("[DevDataSeeder] Seeded demo disasters, locations, and relief requests");
    }

    private static String capitalizeRole(String roleName) {
        return roleName.charAt(0) + roleName.substring(1).toLowerCase().replace('_', ' ');
    }
}
