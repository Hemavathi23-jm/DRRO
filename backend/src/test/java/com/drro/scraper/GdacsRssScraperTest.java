package com.drro.scraper;

import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GdacsRssScraperTest {

    @Test
    void parseItem_extractsCoordinatesAndSeverity() {
        String xml = """
            <rss xmlns:gdacs="http://www.gdacs.org" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
              <channel>
                <item>
                  <title>Orange earthquake (Magnitude 5.6M) in Mexico</title>
                  <description>Earthquake in Mexico</description>
                  <link>https://www.gdacs.org/report.aspx?eventtype=EQ&amp;eventid=123</link>
                  <guid isPermaLink="false">EQ123</guid>
                  <gdacs:iscurrent>true</gdacs:iscurrent>
                  <gdacs:fromdate>Wed, 02 Sep 2026 12:28:31 GMT</gdacs:fromdate>
                  <gdacs:eventtype>EQ</gdacs:eventtype>
                  <gdacs:alertlevel>Orange</gdacs:alertlevel>
                  <gdacs:severity unit="M" value="5.6">Magnitude 5.6M</gdacs:severity>
                  <gdacs:country>Mexico</gdacs:country>
                  <geo:Point><geo:lat>14.39</geo:lat><geo:long>-92.98</geo:long></geo:Point>
                </item>
              </channel>
            </rss>
            """;

        var doc = Jsoup.parse(xml, "", Parser.xmlParser());
        var item = doc.selectFirst("item");

        GdacsRssScraper scraper = new GdacsRssScraper(new WebPageFetcher());
        var record = scraper.parseItem(item);

        assertEquals("GDACS", record.getSource());
        assertEquals("EQ123", record.getExternalId());
        assertEquals("EARTHQUAKE", record.getType().name());
        assertFalse(record.getTitle().isBlank());
        assertEquals(14.39, record.getLatitude().doubleValue(), 0.01);
        assertEquals(-92.98, record.getLongitude().doubleValue(), 0.01);
    }
}
