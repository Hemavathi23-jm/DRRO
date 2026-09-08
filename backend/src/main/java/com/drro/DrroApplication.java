package com.drro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.drro.config.DrroProperties;

/**
 * DRRO — Disaster Resource Response Optimizer
 *
 * Config flow:
 *   .env  →  application.properties (${VAR})  →  DrroProperties  →  all services
 */
@SpringBootApplication
@EnableConfigurationProperties(DrroProperties.class)
@EnableScheduling
public class DrroApplication {
    public static void main(String[] args) {
        SpringApplication.run(DrroApplication.class, args);
    }
}
