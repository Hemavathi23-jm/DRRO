package com.drro.scraper;

import com.drro.entity.Disaster;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Value
@Builder
public class ScrapedDisasterRecord {
    String source;
    String externalId;
    String title;
    Disaster.DisasterType type;
    Integer severity;
    OffsetDateTime startTime;
    BigDecimal latitude;
    BigDecimal longitude;
    String description;
    String sourceUrl;
    boolean active;
}
