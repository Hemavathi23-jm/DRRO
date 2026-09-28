package com.drro.scraper;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class WebPageFetcher {

    @Value("${drro.external.user-agent:DRRO/1.0 (academic disaster-management project)}")
    private String userAgent;

    @Value("${drro.external.timeout-ms:20000}")
    private int timeoutMs;

    public Document fetchXml(String url) {
        try {
            Connection.Response response = Jsoup.connect(url)
                    .userAgent(userAgent)
                    .timeout(timeoutMs)
                    .ignoreContentType(true)
                    .followRedirects(true)
                    .execute();
            return Jsoup.parse(response.body(), url, Parser.xmlParser());
        } catch (Exception e) {
            throw new WebScrapeException("Failed to fetch " + url + ": " + e.getMessage(), e);
        }
    }

    /** Raw body for JSON APIs (NASA EONET, ReliefWeb, etc.). */
    public String fetchBody(String url) {
        try {
            Connection.Response response = Jsoup.connect(url)
                    .userAgent(userAgent)
                    .timeout(timeoutMs)
                    .ignoreContentType(true)
                    .followRedirects(true)
                    .header("Accept", "application/json, text/plain, */*")
                    .execute();
            return response.body();
        } catch (Exception e) {
            throw new WebScrapeException("Failed to fetch " + url + ": " + e.getMessage(), e);
        }
    }

    public String postForm(String url, String fieldName, String fieldValue) {
        try {
            Connection.Response response = Jsoup.connect(url)
                    .userAgent(userAgent)
                    .timeout(Math.max(timeoutMs, 30000))
                    .ignoreContentType(true)
                    .followRedirects(true)
                    .method(Connection.Method.POST)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .data(fieldName, fieldValue)
                    .execute();
            return response.body();
        } catch (Exception e) {
            throw new WebScrapeException("Failed to POST " + url + ": " + e.getMessage(), e);
        }
    }
}
