package com.drro.scraper;

import lombok.extern.slf4j.Slf4j;
import java.util.List;

/**
 * UN OCHA ReliefWeb scraper — Disabled upon request.
 */
@Slf4j
public class ReliefWebDisasterScraper implements DisasterWebScraper {

    @Override
    public String sourceName() {
        return "RELIEFWEB";
    }

    @Override
    public List<ScrapedDisasterRecord> scrape() {
        return List.of();
    }
}
