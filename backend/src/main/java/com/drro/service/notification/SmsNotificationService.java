package com.drro.service.notification;

import com.drro.config.DrroProperties;
import com.drro.dto.response.SmsSendResponse;
import com.drro.entity.SmsLog;
import com.drro.repository.SmsLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise SMS Gateway Service supporting Twilio Free Tier, Fast2SMS Free API,
 * and high-fidelity In-App Simulated SMS fallback.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsNotificationService {

    private final DrroProperties drroProperties;
    private final SmsLogRepository smsLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public enum SmsResult {
        SENT,
        SIMULATED,
        FAILED
    }

    /**
     * Legacy/convenience send method
     */
    public SmsResult send(String phone, String message) {
        SmsSendResponse resp = sendSms(phone, "User", "OFFICER", "NOTIFICATION", message);
        if ("SENT".equalsIgnoreCase(resp.getStatus())) return SmsResult.SENT;
        if ("FAILED".equalsIgnoreCase(resp.getStatus())) return SmsResult.FAILED;
        return SmsResult.SIMULATED;
    }

    /**
     * Central entry point to dispatch an SMS and record it in the audit log.
     */

    public SmsSendResponse sendSms(String phone, String name, String role, String eventType, String message) {
        String targetPhone = (phone != null && !phone.trim().isEmpty()) ? phone.trim() : drroProperties.getSms().getAdminPhone();
        String targetRole = (role != null) ? role : "RECIPIENT";
        String targetEvent = (eventType != null) ? eventType : "SYSTEM_ALERT";
        
        log.info("[SMS DISPATCH] Initiating SMS to {} (Role: {}, Event: {}): {}", targetPhone, targetRole, targetEvent, message);

        String status = "SIMULATED";
        String gatewayResponse = "Logged locally via DRRO SMS Engine";

        DrroProperties.Sms smsConfig = drroProperties.getSms();

        if (smsConfig.isEnabled()) {
            String provider = smsConfig.getProvider();

            if ("twilio".equalsIgnoreCase(provider) && isTwilioConfigured(smsConfig.getTwilio())) {
                try {
                    gatewayResponse = sendViaTwilio(smsConfig.getTwilio(), targetPhone, message);
                    status = "SENT";
                    log.info("[SMS/TWILIO] Sent successfully to {}. Gateway Response: {}", targetPhone, gatewayResponse);
                } catch (Exception e) {
                    log.warn("[SMS/TWILIO] Failed to send via Twilio API (Fallback to simulation): {}", e.getMessage());
                    status = "SIMULATED";
                    gatewayResponse = "Twilio Error (Fallback): " + e.getMessage();
                }
            } else if ("fast2sms".equalsIgnoreCase(provider) && isFast2SmsConfigured(smsConfig.getFast2sms())) {
                try {
                    gatewayResponse = sendViaFast2Sms(smsConfig.getFast2sms(), targetPhone, message);
                    status = "SENT";
                    log.info("[SMS/FAST2SMS] Sent successfully to {}. Gateway Response: {}", targetPhone, gatewayResponse);
                } catch (Exception e) {
                    log.warn("[SMS/FAST2SMS] Failed to send via Fast2SMS (Fallback to simulation): {}", e.getMessage());
                    status = "SIMULATED";
                    gatewayResponse = "Fast2SMS Error (Fallback): " + e.getMessage();
                }
            } else {
                log.info("[SMS/SIMULATION] No live gateway credentials configured. SMS recorded to in-app audit ledger for {}.", targetPhone);
                status = "SIMULATED";
                gatewayResponse = "Simulated delivery (Add TWILIO_ACCOUNT_SID or FAST2SMS_API_KEY in .env for carrier delivery)";
            }
        }

        // Save into DB SMS Ledger
        SmsLog logEntry = SmsLog.builder()
                .recipientPhone(targetPhone)
                .recipientName(name != null ? name : "Field Officer")
                .recipientRole(targetRole)
                .eventType(targetEvent)
                .message(message)
                .status(status)
                .gatewayResponse(gatewayResponse)
                .sentAt(OffsetDateTime.now())
                .build();

        SmsLog saved = smsLogRepository.save(logEntry);

        return toResponse(saved);
    }

    /**
     * Send Alert to System Administrator
     */
    public SmsSendResponse sendAdminAlert(String eventType, String title, String detail) {
        String adminPhone = drroProperties.getSms().getAdminPhone();
        String msg = String.format("🛡️ [DRRO ADMIN ALERT] %s: %s", title, detail);
        return sendSms(adminPhone, "System Administrator", "ADMIN", eventType, msg);
    }

    /**
     * Send Urgent Request Alert
     */
    public SmsSendResponse sendUrgentRequestAlert(Long requestId, String disasterName, String location, String itemsSummary, String phone) {
        String msg = String.format("🚨 [DRRO ALERT] Urgent Relief Request #%d for %s (%s). Items: %s. Review: http://localhost:5173/requests/%d",
                requestId, disasterName != null ? disasterName : "Disaster", location, itemsSummary, requestId);
        return sendSms(phone, "Disaster Response Lead", "FIELD_OFFICER", "REQUEST_URGENT", msg);
    }

    /**
     * Send Team Dispatch Notification
     */
    public SmsSendResponse sendDispatchAlert(String teamName, int membersCount, String location, String vehicle, Double etaHours, String leadPhone, String leadName) {
        String etaStr = (etaHours != null && etaHours > 0) ? String.format("%.1f hrs", etaHours) : "En Route";
        String msg = String.format("🚚 [DRRO DISPATCH] Batch %s (%d personnel) dispatched to %s. Vehicle: %s. ETA: %s.",
                teamName, membersCount, location, vehicle != null ? vehicle : "Fleet Transport", etaStr);
        return sendSms(leadPhone, leadName != null ? leadName : "Batch Team Lead", "TEAM_LEAD", "DISPATCH", msg);
    }

    /**
     * Send Delivery Confirmation
     */
    public SmsSendResponse sendDeliveryAlert(Long requestId, String location, String itemsDelivered, String recipientPhone, String recipientName) {
        String msg = String.format("✅ [DRRO DELIVERED] Request #%d at %s completed successfully. Delivered: %s. Status: FULFILLED.",
                requestId, location, itemsDelivered);
        return sendSms(recipientPhone, recipientName != null ? recipientName : "Field Coordinator", "FIELD_OFFICER", "DELIVERY_POD", msg);
    }

    /**
     * Send Low Stock Restock Warning
     */
    public SmsSendResponse sendLowStockAlert(String resourceName, int remainingQty, String centerName, String managerPhone) {
        String msg = String.format("⚠️ [DRRO STOCK ALERT] Low stock warning for %s (%d units left at %s). Restock requested.",
                resourceName, remainingQty, centerName != null ? centerName : "Warehouse Hub");
        return sendSms(managerPhone, "Warehouse Manager", "WAREHOUSE_MGR", "STOCK_WARNING", msg);
    }

    /**
     * Retrieve recent SMS history
     */
    public List<SmsSendResponse> getRecentLogs() {
        return smsLogRepository.findTop50ByOrderBySentAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private boolean isTwilioConfigured(DrroProperties.Sms.Twilio twilio) {
        return twilio != null &&
                twilio.getAccountSid() != null && !twilio.getAccountSid().isBlank() &&
                twilio.getAuthToken() != null && !twilio.getAuthToken().isBlank() &&
                twilio.getFromNumber() != null && !twilio.getFromNumber().isBlank();
    }

    private boolean isFast2SmsConfigured(DrroProperties.Sms.Fast2Sms fast2Sms) {
        return fast2Sms != null &&
                fast2Sms.getApiKey() != null && !fast2Sms.getApiKey().isBlank();
    }

    /**
     * Twilio REST API integration without third-party heavyweight SDKs.
     */
    private String sendViaTwilio(DrroProperties.Sms.Twilio twilio, String toPhone, String body) {
        String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", twilio.getAccountSid().trim());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String auth = twilio.getAccountSid().trim() + ":" + twilio.getAuthToken().trim();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("To", toPhone);
        map.add("From", twilio.getFromNumber().trim());
        map.add("Body", body);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        return response.getBody();
    }

    /**
     * Fast2SMS Free API integration.
     */
    private String sendViaFast2Sms(DrroProperties.Sms.Fast2Sms fast2Sms, String toPhone, String body) {
        String url = "https://www.fast2sms.com/dev/bulkV2";

        HttpHeaders headers = new HttpHeaders();
        headers.set("authorization", fast2Sms.getApiKey().trim());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("route", "q");
        map.add("message", body);
        map.add("flash", "0");
        map.add("numbers", toPhone.replace("+", ""));

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        return response.getBody();
    }

    private SmsSendResponse toResponse(SmsLog log) {
        return SmsSendResponse.builder()
                .smsId(log.getSmsId())
                .recipientPhone(log.getRecipientPhone())
                .recipientName(log.getRecipientName())
                .recipientRole(log.getRecipientRole())
                .eventType(log.getEventType())
                .message(log.getMessage())
                .status(log.getStatus())
                .gatewayResponse(log.getGatewayResponse())
                .sentAt(log.getSentAt())
                .build();
    }
}
