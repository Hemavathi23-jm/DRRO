package com.drro.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * JWT + OpenAPI / Swagger configuration.
 *
 * Registers the Bearer token security scheme so that
 * the Swagger UI shows an "Authorize" button for JWT.
 *
 * JWT values (secret, expiry) are managed by DrroProperties → .env
 */
@Configuration
@RequiredArgsConstructor
@SecurityScheme(
    name       = "bearerAuth",
    type       = SecuritySchemeType.HTTP,
    scheme     = "bearer",
    bearerFormat = "JWT",
    in         = SecuritySchemeIn.HEADER,
    description = "Paste your JWT token here (without 'Bearer ' prefix)"
)
public class JwtConfig {

    private final DrroProperties drroProperties;

    /**
     * OpenAPI metadata shown in Swagger UI at /swagger-ui.html
     */
    @Bean
    public OpenAPI drroOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("DRRO — Disaster Resource Response Optimizer API")
                        .description(
                                "REST API for the DRRO system. " +
                                "Manages disasters, locations, resource centers, inventory, " +
                                "relief requests, and runs the explainable allocation engine.\n\n" +
                                "**JWT Expiry:** " + drroProperties.getJwt().getExpirationMs() / 3600000 + " hours")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DRRO Team")
                                .email("hemavathi23jm@gmail.com")));
    }
}
