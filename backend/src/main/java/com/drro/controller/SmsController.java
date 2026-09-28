package com.drro.controller;

import com.drro.config.DrroProperties;
import com.drro.dto.request.SmsSendRequest;
import com.drro.dto.response.SmsSendResponse;
import com.drro.service.notification.SmsNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
@Tag(name = "SMS Notifications", description = "SMS alerts and gateway integration for DRRO")
public class SmsController {

    private final SmsNotificationService smsNotificationService;
    private final DrroProperties drroProperties;

    @GetMapping("/logs")
    @Operation(summary = "Get recent SMS dispatch logs")
    public ResponseEntity<List<SmsSendResponse>> getLogs() {
        List<SmsSendResponse> logs = smsNotificationService.getRecentLogs();
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/send")
    @Operation(summary = "Send an SMS alert")
    public ResponseEntity<SmsSendResponse> sendSms(@Valid @RequestBody SmsSendRequest request) {
        SmsSendResponse response = smsNotificationService.sendSms(
                request.getRecipientPhone(),
                request.getRecipientName(),
                request.getRecipientRole(),
                request.getEventType(),
                request.getMessage()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test")
    @Operation(summary = "Send a quick test SMS to any phone number")
    public ResponseEntity<SmsSendResponse> testSms(
            @RequestParam(required = false, defaultValue = "+15550199") String phone,
            @RequestParam(required = false, defaultValue = "Admin User") String name,
            @RequestParam(required = false, defaultValue = "🛡️ [DRRO TEST] Twilio SMS gateway connection verified successfully.") String message) {
        
        SmsSendResponse response = smsNotificationService.sendSms(
                phone,
                name,
                "ADMIN",
                "TEST",
                message
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/config")
    @Operation(summary = "Get SMS gateway connection status")
    public ResponseEntity<Map<String, Object>> getSmsConfig() {
        DrroProperties.Sms sms = drroProperties.getSms();
        boolean hasTwilio = sms.getTwilio() != null &&
                sms.getTwilio().getAccountSid() != null && !sms.getTwilio().getAccountSid().isBlank();
        boolean hasFast2Sms = sms.getFast2sms() != null &&
                sms.getFast2sms().getApiKey() != null && !sms.getFast2sms().getApiKey().isBlank();

        Map<String, Object> config = new HashMap<>();
        config.put("enabled", sms.isEnabled());
        config.put("provider", sms.getProvider());
        config.put("adminPhone", sms.getAdminPhone());
        config.put("isLiveConnected", hasTwilio || hasFast2Sms);
        config.put("gatewayMode", hasTwilio ? "Twilio Free Tier (Live)" : (hasFast2Sms ? "Fast2SMS (Live)" : "In-App Simulation Mode"));

        return ResponseEntity.ok(config);
    }
}
