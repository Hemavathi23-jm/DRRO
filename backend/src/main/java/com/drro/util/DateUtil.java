package com.drro.util;

import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility helpers for date/time formatting used across services and reports.
 */
@Component
public class DateUtil {

    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

    private static final DateTimeFormatter ISO_FORMAT =
            DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    /** Format for human-readable display (e.g. "23 Aug 2026, 18:30") */
    public String toDisplay(OffsetDateTime dt) {
        return dt == null ? "—" : dt.format(DISPLAY_FORMAT);
    }

    /** Format as ISO-8601 string */
    public String toIso(OffsetDateTime dt) {
        return dt == null ? null : dt.format(ISO_FORMAT);
    }

    /** Check if a deadline has passed */
    public boolean isOverdue(OffsetDateTime deadline) {
        return deadline != null && OffsetDateTime.now().isAfter(deadline);
    }

    /** Hours remaining until deadline (negative if overdue) */
    public long hoursUntilDeadline(OffsetDateTime deadline) {
        if (deadline == null) return Long.MAX_VALUE;
        return java.time.Duration.between(OffsetDateTime.now(), deadline).toHours();
    }
}
