package com.drro.scraper;

import com.drro.entity.Disaster;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * NASA Earth Observatory Natural Event Tracker (EONET) — open wildfires, storms, volcanoes, etc.
 * API: https://eonet.gsfc.nasa.gov/api/v3/events
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NasaEonetScraper implements DisasterWebScraper {

    // India + Nepal focus region
    private static final double BBOX_LAT_MIN = 6.0;
    private static final double BBOX_LAT_MAX = 37.0;
    private static final double BBOX_LON_MIN = 68.0;
    private static final double BBOX_LON_MAX = 98.0;

    private final WebPageFetcher fetcher;
    private final ObjectMapper objectMapper;

    @Value("${drro.external.eonet-enabled:true}")
    private boolean enabled;

    @Value("${drro.external.eonet-url:https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=80}")
    private String eonetUrl;

    @Value("${drro.external.eonet-max-records:40}")
    private int maxRecords;

    @Override
    public String sourceName() {
        return "NASA_EONET";
    }

    @Override
    public List<ScrapedDisasterRecord> scrape() {
        if (!enabled) return List.of();

        try {
            String body = fetcher.fetchBody(eonetUrl);
            JsonNode root = objectMapper.readTree(body);
            JsonNode events = root.path("events");
            if (!events.isArray()) return List.of();

            List<ScrapedDisasterRecord> records = new ArrayList<>();
            for (JsonNode event : events) {
                try {
                    ScrapedDisasterRecord record = parseEvent(event);
                    if (record == null) continue;
                    if (!isInFocusRegion(record.getLatitude(), record.getLongitude())) continue;
                    records.add(record);
                    if (records.size() >= maxRecords) break;
                } catch (Exception e) {
                    log.warn("[NASA_EONET] Skipped event: {}", e.getMessage());
                }
            }
            log.info("[NASA_EONET] Scraped {} natural-event records", records.size());
            return records;
        } catch (Exception e) {
            throw new WebScrapeException("NASA EONET scrape failed: " + e.getMessage(), e);
        }
    }

    private ScrapedDisasterRecord parseEvent(JsonNode event) {
        String id = text(event, "id");
        String title = text(event, "title");
        if (id.isBlank() || title.isBlank()) return null;

        String category = "";
        JsonNode cats = event.path("categories");
        if (cats.isArray() && !cats.isEmpty()) {
            category = text(cats.get(0), "title");
        }

        BigDecimal lat = null;
        BigDecimal lon = null;
        OffsetDateTime startTime = null;
        JsonNode geometries = event.path("geometry");
        if (geometries.isArray()) {
            for (JsonNode g : geometries) {
                JsonNode coords = g.path("coordinates");
                if (coords.isArray() && coords.size() >= 2) {
                    // GeoJSON: [lon, lat]
                    lon = decimal(coords.get(0));
                    lat = decimal(coords.get(1));
                }
                String date = text(g, "date");
                if (!date.isBlank() && startTime == null) {
                    startTime = parseDate(date);
                }
                if (lat != null && lon != null) break;
            }
        }

        String link = "";
        JsonNode sources = event.path("sources");
        if (sources.isArray() && !sources.isEmpty()) {
            link = text(sources.get(0), "url");
        }
        if (link.isBlank()) {
            link = "https://eonet.gsfc.nasa.gov/api/v3/events/" + id;
        }

        Disaster.DisasterType type = mapType(category, title);
        int severity = mapSeverity(category);
        String description = "NASA EONET open event"
                + (category.isBlank() ? "" : " · Category: " + category)
                + "\n\nSource: " + link;

        return ScrapedDisasterRecord.builder()
                .source(sourceName())
                .externalId(id)
                .title(trim(title, 200))
                .type(type)
                .severity(severity)
                .startTime(startTime != null ? startTime : OffsetDateTime.now())
                .latitude(lat)
                .longitude(lon)
                .description(trim(description, 4000))
                .sourceUrl(link)
                .active(true)
                .build();
    }

    private static Disaster.DisasterType mapType(String category, String title) {
        String c = (category + " " + title).toLowerCase(Locale.ROOT);
        if (c.contains("wildfire") || c.contains("fire")) return Disaster.DisasterType.WILDFIRE;
        if (c.contains("flood")) return Disaster.DisasterType.FLOOD;
        if (c.contains("earthquake") || c.contains("seismic")) return Disaster.DisasterType.EARTHQUAKE;
        if (c.contains("storm") || c.contains("cyclone") || c.contains("hurricane") || c.contains("typhoon")) {
            return Disaster.DisasterType.CYCLONE;
        }
        if (c.contains("landslide") || c.contains("slide")) return Disaster.DisasterType.LANDSLIDE;
        if (c.contains("volcano")) return Disaster.DisasterType.OTHER;
        return Disaster.DisasterType.OTHER;
    }

    private static int mapSeverity(String category) {
        String c = category == null ? "" : category.toLowerCase(Locale.ROOT);
        if (c.contains("wildfire") || c.contains("volcano") || c.contains("severe")) return 80;
        if (c.contains("storm") || c.contains("flood")) return 70;
        return 60;
    }

    private static boolean isInFocusRegion(BigDecimal lat, BigDecimal lon) {
        if (lat == null || lon == null) return false;
        double la = lat.doubleValue();
        double lo = lon.doubleValue();
        return la >= BBOX_LAT_MIN && la <= BBOX_LAT_MAX
                && lo >= BBOX_LON_MIN && lo <= BBOX_LON_MAX;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.path(field);
        return v.isMissingNode() || v.isNull() ? "" : v.asText("").trim();
    }

    private static BigDecimal decimal(JsonNode node) {
        if (node == null || node.isNull()) return null;
        try {
            return new BigDecimal(node.asText());
        } catch (Exception e) {
            return null;
        }
    }

    private static OffsetDateTime parseDate(String raw) {
        try {
            return OffsetDateTime.parse(raw.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static String trim(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max - 3) + "...";
    }
}
