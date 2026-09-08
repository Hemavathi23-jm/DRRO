package com.drro.scraper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Scrapes nearby hospitals, shelters, and assembly points from OpenStreetMap (Overpass API).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OsmSafePlaceScraper {

    private final WebPageFetcher fetcher;
    private final ObjectMapper objectMapper;

    @Value("${drro.external.osm-enabled:true}")
    private boolean enabled;

    @Value("${drro.external.osm-url:https://overpass-api.de/api/interpreter}")
    private String overpassUrl;

    @Value("${drro.external.osm-radius-m:15000}")
    private int radiusMeters;

    @Value("${drro.external.osm-max-results:12}")
    private int maxResults;

    public boolean isEnabled() {
        return enabled;
    }

    public List<OsmPlace> scrapeNear(double latitude, double longitude, double maxKm) {
        if (!enabled) return List.of();

        int radius = (int) Math.min(radiusMeters, Math.max(1000, maxKm * 1000));
        String query = """
                [out:json][timeout:25];
                (
                  node["amenity"="hospital"](around:%d,%s,%s);
                  node["amenity"="clinic"](around:%d,%s,%s);
                  node["amenity"="shelter"](around:%d,%s,%s);
                  node["emergency"="assembly_point"](around:%d,%s,%s);
                  node["social_facility"="shelter"](around:%d,%s,%s);
                  way["amenity"="hospital"](around:%d,%s,%s);
                  way["amenity"="shelter"](around:%d,%s,%s);
                );
                out center %d;
                """.formatted(
                radius, latitude, longitude,
                radius, latitude, longitude,
                radius, latitude, longitude,
                radius, latitude, longitude,
                radius, latitude, longitude,
                radius, latitude, longitude,
                radius, latitude, longitude,
                maxResults);

        try {
            String body = fetcher.postForm(overpassUrl, "data", query);
            JsonNode root = objectMapper.readTree(body);
            JsonNode elements = root.path("elements");
            List<OsmPlace> places = new ArrayList<>();

            if (!elements.isArray()) return places;

            for (JsonNode el : elements) {
                OsmPlace place = parseElement(el);
                if (place != null) places.add(place);
                if (places.size() >= maxResults) break;
            }

            log.info("[OSM] Found {} safe-place candidates near {},{}", places.size(), latitude, longitude);
            return places;
        } catch (Exception e) {
            log.warn("[OSM] Safe-place scrape failed: {}", e.getMessage());
            return List.of();
        }
    }

    private OsmPlace parseElement(JsonNode el) {
        JsonNode tags = el.path("tags");
        String name = text(tags, "name");
        if (name.isBlank()) name = text(tags, "official_name");
        if (name.isBlank()) name = fallbackName(tags);

        Double lat = numeric(el, "lat");
        Double lon = numeric(el, "lon");
        if (lat == null || lon == null) {
            lat = numeric(el.path("center"), "lat");
            lon = numeric(el.path("center"), "lon");
        }
        if (lat == null || lon == null) return null;

        String type = classify(tags);
        String address = buildAddress(tags);
        String osmId = el.path("type").asText("node") + "/" + el.path("id").asText();

        return new OsmPlace(
                osmId,
                name,
                BigDecimal.valueOf(lat),
                BigDecimal.valueOf(lon),
                address,
                type
        );
    }

    private static String classify(JsonNode tags) {
        String amenity = text(tags, "amenity").toLowerCase(Locale.ROOT);
        String emergency = text(tags, "emergency").toLowerCase(Locale.ROOT);
        String social = text(tags, "social_facility").toLowerCase(Locale.ROOT);
        if ("hospital".equals(amenity)) return "Hospital";
        if ("clinic".equals(amenity)) return "Clinic";
        if ("shelter".equals(amenity) || "shelter".equals(social)) return "Shelter";
        if ("assembly_point".equals(emergency)) return "Assembly Point";
        return "Public Facility";
    }

    private static String fallbackName(JsonNode tags) {
        return "Unnamed " + classify(tags);
    }

    private static String buildAddress(JsonNode tags) {
        String street = text(tags, "addr:street");
        String city = text(tags, "addr:city");
        String full = text(tags, "addr:full");
        if (!full.isBlank()) return full;
        if (!street.isBlank() && !city.isBlank()) return street + ", " + city;
        if (!street.isBlank()) return street;
        if (!city.isBlank()) return city;
        return null;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.path(field);
        return v.isMissingNode() || v.isNull() ? "" : v.asText("").trim();
    }

    private static Double numeric(JsonNode node, String field) {
        JsonNode v = node.path(field);
        if (v.isMissingNode() || v.isNull()) return null;
        if (v.isNumber()) return v.asDouble();
        try {
            return Double.parseDouble(v.asText());
        } catch (Exception e) {
            return null;
        }
    }

    public record OsmPlace(
            String osmId,
            String name,
            BigDecimal latitude,
            BigDecimal longitude,
            String address,
            String type
    ) {}
}
