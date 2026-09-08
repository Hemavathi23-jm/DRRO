package com.drro.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * General application configuration beans.
 *
 * - ObjectMapper: configured for Java 8 date/time types (OffsetDateTime, LocalDate)
 *   so that API responses serialize dates as ISO-8601 strings, not arrays.
 */
@Configuration
public class AppConfig {

    /**
     * Jackson ObjectMapper with JavaTimeModule registered.
     * Ensures OffsetDateTime fields serialize to "2026-08-23T18:30:00+05:30"
     * instead of a numeric array.
     *
     * Config values (if any) come from DrroProperties → application.properties → .env
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Register module for Java 8 date/time types
        mapper.registerModule(new JavaTimeModule());
        // Write dates as ISO strings, not timestamps
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
