package com.drro.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Central configuration bean — reads ALL custom DRRO properties
 * from application.properties (which reads from .env via spring-dotenv).
 *
 * Usage: inject DrroProperties anywhere instead of using @Value.
 *
 * application.properties → .env → DrroProperties → any service/component
 */
@Component
@ConfigurationProperties(prefix = "drro")
@Getter
@Setter
public class DrroProperties {

    /** JWT settings */
    private Jwt jwt = new Jwt();

    /** CORS settings */
    private Cors cors = new Cors();

    /** SMS settings */
    private Sms sms = new Sms();

    @Getter @Setter
    public static class Sms {
        private boolean enabled = true;
        private String provider = "twilio"; // twilio, fast2sms, mock
        private String adminPhone = "+15550199";
        private Twilio twilio = new Twilio();
        private Fast2Sms fast2sms = new Fast2Sms();

        @Getter @Setter
        public static class Twilio {
            private String accountSid = "";
            private String authToken = "";
            private String fromNumber = "";
        }

        @Getter @Setter
        public static class Fast2Sms {
            private String apiKey = "";
        }
    }

    @Getter @Setter
    public static class Jwt {
        /** Secret key for signing JWT tokens (read from JWT_SECRET in .env) */
        private String secret;

        /** Token validity in milliseconds (read from JWT_EXPIRATION_MS in .env) */
        private long expirationMs = 86_400_000L;
    }

    @Getter @Setter
    public static class Cors {
        /** Comma-separated list of allowed frontend origins (read from CORS_ALLOWED_ORIGINS in .env) */
        private String allowedOrigins = "http://localhost:5173";
    }
}

