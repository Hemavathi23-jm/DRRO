package com.drro.scraper;

import com.drro.entity.Disaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class GdacsRssScraper implements DisasterWebScraper {

    private static final DateTimeFormatter RSS_DATE =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss z", Locale.ENGLISH);

    private final WebPageFetcher fetcher;

    @Value("${drro.external.gdacs-url:https://www.gdacs.org/xml/rss.xml}")
    private String gdacsUrl;

    @Value("${drro.external.gdacs-enabled:true}")
    private boolean enabled;

    @Value("${drro.external.gdacs-max-records:40}")
    private int maxRecords;

    // Countries of focus — India and Nepal
    private static final Set<String> FOCUS_COUNTRIES = Set.of(
            "india", "nepal"
    );

    @Override
    public String sourceName() {
        return "GDACS";
    }

    @Override
    public List<ScrapedDisasterRecord> scrape() {
        if (!enabled) return List.of();

        Document doc = fetcher.fetchXml(gdacsUrl);
        Elements items = doc.select("item");
        List<ScrapedDisasterRecord> records = new ArrayList<>();

        for (Element item : items) {
            try {
                if (!"true".equalsIgnoreCase(text(item, "gdacs|iscurrent"))) {
                    continue;
                }
                // Filter: only India and Nepal
                String country = text(item, "gdacs|country").toLowerCase(java.util.Locale.ROOT).trim();
                boolean inFocus = FOCUS_COUNTRIES.stream().anyMatch(country::contains);
                if (!inFocus) continue;

                ScrapedDisasterRecord record = parseItem(item);
                if (record != null) {
                    records.add(record);
                    if (records.size() >= maxRecords) break;
                }
            } catch (Exception e) {
                log.warn("[GDACS] Skipped item: {}", e.getMessage());
            }
        }

        log.info("[GDACS] Scraped {} disaster records", records.size());
        return records;
    }

    ScrapedDisasterRecord parseItem(Element item) {
        String externalId = text(item, "guid");
        if (externalId.isBlank()) {
            externalId = attr(item, "gdacs|eventid");
        }
        if (externalId.isBlank()) return null;

        String title = text(item, "title");
        if (title.isBlank()) return null;

        String eventType = attr(item, "gdacs|eventtype");
        String alertLevel = attr(item, "gdacs|alertlevel");
        String severityValue = attr(item, "gdacs|severity");
        String isCurrent = text(item, "gdacs|iscurrent");
        String link = text(item, "link");
        String description = text(item, "description");
        String country = text(item, "gdacs|country");

        BigDecimal lat = parseDecimal(firstNonBlank(
                text(item, "geo|lat"),
                pointPart(item, 0)));
        BigDecimal lon = parseDecimal(firstNonBlank(
                text(item, "geo|long"),
                pointPart(item, 1)));

        OffsetDateTime startTime = parseDate(firstNonBlank(
                text(item, "gdacs|fromdate"),
                text(item, "pubDate")));

        int severity = mapSeverity(alertLevel, severityValue, eventType);
        boolean active = "true".equalsIgnoreCase(isCurrent) || alertLevel.equalsIgnoreCase("Red")
                || alertLevel.equalsIgnoreCase("Orange");

        String fullTitle = country.isBlank() ? title : title + " — " + country;

        return ScrapedDisasterRecord.builder()
                .source(sourceName())
                .externalId(externalId)
                .title(trim(fullTitle, 200))
                .type(mapType(eventType, title))
                .severity(severity)
                .startTime(startTime != null ? startTime : OffsetDateTime.now())
                .latitude(lat)
                .longitude(lon)
                .description(buildDescription(description, link, alertLevel))
                .sourceUrl(link.isBlank() ? gdacsUrl : link)
                .active(active)
                .build();
    }

    private static String buildDescription(String description, String link, String alertLevel) {
        StringBuilder sb = new StringBuilder();
        if (!description.isBlank()) sb.append(description.trim());
        if (!alertLevel.isBlank()) {
            if (!sb.isEmpty()) sb.append("\n\n");
            sb.append("Alert level: ").append(alertLevel);
        }
        if (!link.isBlank()) {
            if (!sb.isEmpty()) sb.append("\n\n");
            sb.append("Source: ").append(link);
        }
        return trim(sb.toString(), 4000);
    }

    private static Disaster.DisasterType mapType(String eventType, String title) {
        String code = eventType == null ? "" : eventType.toUpperCase(Locale.ROOT);
        return switch (code) {
            case "EQ" -> Disaster.DisasterType.EARTHQUAKE;
            case "FL", "FF" -> Disaster.DisasterType.FLOOD;
            case "TC", "DR" -> Disaster.DisasterType.CYCLONE;
            case "VO" -> Disaster.DisasterType.OTHER;
            case "WF" -> Disaster.DisasterType.WILDFIRE;
            default -> inferFromTitle(title);
        };
    }

    private static Disaster.DisasterType inferFromTitle(String title) {
        String t = title.toLowerCase(Locale.ROOT);
        if (t.contains("earthquake")) return Disaster.DisasterType.EARTHQUAKE;
        if (t.contains("flood")) return Disaster.DisasterType.FLOOD;
        if (t.contains("cyclone") || t.contains("hurricane") || t.contains("typhoon")) {
            return Disaster.DisasterType.CYCLONE;
        }
        if (t.contains("wildfire") || t.contains("fire")) return Disaster.DisasterType.WILDFIRE;
        if (t.contains("landslide")) return Disaster.DisasterType.LANDSLIDE;
        return Disaster.DisasterType.OTHER;
    }

    private static int mapSeverity(String alertLevel, String severityValue, String eventType) {
        int base = switch (alertLevel == null ? "" : alertLevel.toLowerCase(Locale.ROOT)) {
            case "red" -> 90;
            case "orange" -> 75;
            case "green" -> 55;
            default -> 50;
        };

        if (severityValue != null && !severityValue.isBlank()) {
            try {
                double mag = Double.parseDouble(severityValue);
                if ("EQ".equalsIgnoreCase(eventType)) {
                    base = Math.max(base, (int) Math.min(100, mag * 12));
                }
            } catch (NumberFormatException ignored) {
                // keep alert-based severity
            }
        }
        return Math.min(100, Math.max(30, base));
    }

    private static String text(Element parent, String selector) {
        Element el = parent.selectFirst(selector);
        return el != null ? el.text().trim() : "";
    }

    private static String attr(Element parent, String selector) {
        Element el = parent.selectFirst(selector);
        if (el == null) return "";
        String val = el.hasAttr("value") ? el.attr("value") : el.text();
        return val != null ? val.trim() : "";
    }

    private static String pointPart(Element item, int index) {
        String point = text(item, "georss|point");
        if (point.isBlank()) return "";
        String[] parts = point.trim().split("\\s+");
        return parts.length > index ? parts[index] : "";
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static OffsetDateTime parseDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return ZonedDateTime.parse(raw.trim(), RSS_DATE).toOffsetDateTime();
        } catch (Exception e) {
            return null;
        }
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return "";
    }

    private static String trim(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max - 3) + "...";
    }
}
