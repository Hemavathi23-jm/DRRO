package com.drro.security;

import com.drro.config.DrroProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Generates and validates JWT tokens.
 * All secrets come from DrroProperties → application.properties → .env
 */
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final DrroProperties drroProperties;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(drroProperties.getJwt().getSecret().getBytes());
    }

    /** Generate JWT token from authenticated user's email */
    public String generateToken(String email) {
        long expirationMs = drroProperties.getJwt().getExpirationMs();
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /** Extract email from JWT token */
    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /** Validate token — returns true if valid */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
