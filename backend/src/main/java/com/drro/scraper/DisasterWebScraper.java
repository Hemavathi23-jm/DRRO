package com.drro.scraper;

import java.util.List;

public interface DisasterWebScraper {
    String sourceName();
    List<ScrapedDisasterRecord> scrape();
}
