package com.drro.util;

import org.springframework.stereotype.Component;

/**
 * Haversine formula implementation for calculating great-circle distance
 * between two geographic points.
 */
@Component
public class HaversineUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculate distance in kilometres between two lat/lon points.
     */
    public double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Estimate travel time in hours assuming an average speed of 50 km/h.
     */
    public double estimatedTravelHours(double distanceKm) {
        return distanceKm / 50.0;
    }
}
