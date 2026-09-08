package com.drro.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HaversineUtilTest {
    private final HaversineUtil util = new HaversineUtil();

    @Test
    void returnsZeroForTheSameCoordinate() {
        assertEquals(0.0, util.distanceKm(12.9716, 77.5946, 12.9716, 77.5946), 0.0001);
    }

    @Test
    void estimatesKnownBengaluruToChennaiDistanceAndTravelTime() {
        double distance = util.distanceKm(12.9716, 77.5946, 13.0827, 80.2707);
        assertEquals(290.0, distance, 15.0);
        assertEquals(distance / 50.0, util.estimatedTravelHours(distance), 0.0001);
    }
}