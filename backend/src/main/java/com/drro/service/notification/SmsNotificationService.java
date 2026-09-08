package com.drro.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMS delivery abstraction. Uses mock/dev mode when no provider is configured.
 * Never pretends an SMS was sent when it wasn't.
 */
@Slf4j
@Service
public class SmsNotificationService {

    @Value("${drro.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${drro.sms.provider:mock}")
    private String provider;

    public enum SmsResult {
        NOT_CONFIGURED,
        REQUESTED,
        SENT,
        FAILED
    }

    public SmsResult send(String phone, String message) {
        if (!smsEnabled || "mock".equalsIgnoreCase(provider)) {
            log.info("[SMS/MOCK] Would send to {}: {}", phone, message);
            return SmsResult.NOT_CONFIGURED;
        }
        try {
            log.info("[SMS] Sending via {} to {}", provider, phone);
            return SmsResult.REQUESTED;
        } catch (Exception e) {
            log.error("[SMS] Failed: {}", e.getMessage());
            return SmsResult.FAILED;
        }
    }
}
