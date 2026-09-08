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
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class UsgsEarthquakeScraper implements DisasterWebScraper {

    private static final Pattern MAGNITUDE = Pattern.compile("M\\s*([0-9]+(?:\\.[0-9]+)?)", Pattern.CASE_INSENSITIVE);

    // Bounding box covering India + Nepal
    // Latitude:  6°N – 37°N
    // Longitude: 68°E – 98°E
    private static final double BBOX_LAT_MIN =  6.0;
    private static final double BBOX_LAT_MAX = 37.0;
    private static final double BBOX_LON_MIN = 68.0;
    private static final double BBOX_LON_MAX = 98.0;

    private final WebPageFetcher fetcher;

    @Value("${drro.external.usgs-url:https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom}")
    private String usgsUrl;

    @Value("${drro.external.usgs-enabled:true}")
    private boolean enabled;

    @Value("${drro.external.usgs-min-magnitude:4.5}")
    private double minMagnitude;

    @Override
    public String sourceName() {
        return "USGS";
    }

    @Override
    public List<ScrapedDisasterRecord> scrape() {
        if (!enabled) return List.of();

        Document doc = fetcher.fetchXml(usgsUrl);
        Elements entries = doc.select("entry");
        List<ScrapedDisasterRecord> records = new ArrayList<>();

        for (Element entry : entries) {
            try {
                ScrapedDisasterRecord record = parseEntry(entry);
                if (record == null) continue;
                // Filter: only keep India + Nepal region
                if (!isInFocusRegion(record.getLatitude(), record.getLongitude())) continue;
                records.add(record);
            } catch (Exception e) {
                log.warn("[USGS] Skipped entry: {}", e.getMessage());
            }
        }

        log.info("[USGS] Scraped {} earthquake records (min M{})", records.size(), minMagnitude);
        return records;
    }

    private ScrapedDisasterRecord parseEntry(Element entry) {
        String externalId = text(entry, "id");
        String title = text(entry, "title");
        if (externalId.isBlank() || title.isBlank()) return null;

        double magnitude = parseMagnitude(title);
        if (magnitude < minMagnitude) return null;

        String point = text(entry, "georss|point");
        BigDecimal lat = null;
        BigDecimal lon = null;
        if (!point.isBlank()) {
            String[] parts = point.trim().split("\\s+");
            if (parts.length >= 2) {
                lat = parseDecimal(parts[0]);
                lon = parseDecimal(parts[1]);
            }
        }

        OffsetDateTime startTime = parseInstant(text(entry, "updated"));
        String link = entry.selectFirst("link[href]") != null
                ? entry.selectFirst("link[href]").attr("href")
                : "";

        int severity = (int) Math.min(100, Math.max(50, magnitude * 12));
        String description = "USGS earthquake feed. Magnitude " + magnitude
                + (link.isBlank() ? "" : "\n\nSource: " + link);

        return ScrapedDisasterRecord.builder()
                .source(sourceName())
                .externalId(externalId)
                .title(trim(title, 200))
                .type(Disaster.DisasterType.EARTHQUAKE)
                .severity(severity)
                .startTime(startTime != null ? startTime : OffsetDateTime.now())
                .latitude(lat)
                .longitude(lon)
                .description(trim(description, 4000))
                .sourceUrl(link.isBlank() ? usgsUrl : link)
                .active(true)
                .build();
    }

    private static boolean isInFocusRegion(java.math.BigDecimal lat, java.math.BigDecimal lon) {
        if (lat == null || lon == null) return false;
        double la = lat.doubleValue();
        double lo = lon.doubleValue();
        return la >= BBOX_LAT_MIN && la <= BBOX_LAT_MAX
            && lo >= BBOX_LON_MIN && lo <= BBOX_LON_MAX;
    }

    private static double parseMagnitude(String title) {
        Matcher m = MAGNITUDE.matcher(title);
        if (m.find()) {
            return Double.parseDouble(m.group(1));
        }
        return 0;
    }

    private static String text(Element parent, String selector) {
        Element el = parent.selectFirst(selector);
        return el != null ? el.text().trim() : "";
    }

    private static BigDecimal parseDecimal(String value) {
        try {
            return new BigDecimal(value.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static OffsetDateTime parseInstant(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return OffsetDateTime.parse(raw.trim());
        } catch (Exception e) {
            try {
                return ZonedDateTime.parse(raw.trim()).toOffsetDateTime();
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private static String trim(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 3) + "...";
    }
}
