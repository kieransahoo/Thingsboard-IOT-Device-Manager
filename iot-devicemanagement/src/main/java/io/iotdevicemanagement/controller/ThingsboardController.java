package io.iotdevicemanagement.controller;

import io.iotdevicemanagement.dto.*;
import io.iotdevicemanagement.exception.AuthenticationException;
import io.iotdevicemanagement.service.ThingsBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.thingsboard.server.common.data.alarm.Alarm;

import java.time.Instant;
import java.util.*;


@RestController
@RequestMapping("/api/iot")
@RequiredArgsConstructor
@CrossOrigin
public class ThingsboardController {

    @Value("${thingsboard.url}")
    private String thingsboardUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private final ThingsBoardService thingsBoardService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse authResponse = thingsBoardService.authenticate(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(authResponse);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/devices/{pageSize}/{page}")
    public ResponseEntity<?> getDevices(@PathVariable int pageSize,
                                        @PathVariable int page,
            @RequestHeader("Authorization") String token) {
        try {
            List<Object> deviceList = thingsBoardService.getDevices(token,pageSize, page);
            return ResponseEntity.ok(deviceList);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/{deviceId}/info")
    public ResponseEntity<Object> getDeviceInfo(@PathVariable String deviceId,@RequestHeader("Authorization") String token) {
        try {
            Object deviceInfo = thingsBoardService.getDeviceInfo(deviceId,token);
            if (deviceInfo != null) {
                return ResponseEntity.ok(deviceInfo);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to fetch device info"));
        }
    }

    @GetMapping("/{deviceId}/alarms")
    public ResponseEntity<?> getDeviceAlarms(
            @PathVariable String deviceId,
            @RequestHeader("Authorization") String token) {
        try {
            List<Alarm> alarms = thingsBoardService.getDeviceAlarms(deviceId, token);
            return ResponseEntity.ok(alarms);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{deviceId}/health")
    public ResponseEntity<?> getDeviceHealth(
            @PathVariable String deviceId,
            @RequestHeader("Authorization") String token) {
        try {
            String response = thingsBoardService.getDeviceHealth(deviceId, token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/rule-chains")
    public ResponseEntity<?> getRuleChains(
            @RequestHeader("Authorization") String authToken,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "0") int page) {

        List<Object> ruleChains = thingsBoardService.getRuleChains(authToken, pageSize, page);
        return ResponseEntity.ok(ruleChains);
    }

    @PostMapping("/rule-chains")
    public ResponseEntity<Object> createRuleChain(
            @RequestHeader("Authorization") String authToken,
            @RequestBody Map<String, Object> ruleChainConfig) {

        Object createdRuleChain = thingsBoardService.createRuleChain(authToken, ruleChainConfig);
        return createdRuleChain != null ?
                ResponseEntity.ok(createdRuleChain) :
                ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/rule-chains/{ruleChainId}")
    public ResponseEntity<Void> deleteRuleChain(
            @RequestHeader("Authorization") String authToken,
            @PathVariable String ruleChainId) {

        boolean success = thingsBoardService.deleteRuleChain(authToken, ruleChainId);
        return success ?
                ResponseEntity.noContent().build() :
                ResponseEntity.notFound().build();
    }

    @GetMapping("/rule-chains/{ruleChainId}/metadata")
    public ResponseEntity<Object> getRuleChainMetadata(
            @RequestHeader("Authorization") String authToken,
            @PathVariable String ruleChainId) {

        Object metadata = thingsBoardService.getRuleChainMetadata(authToken, ruleChainId);
        return metadata != null ?
                ResponseEntity.ok(metadata) :
                ResponseEntity.notFound().build();
    }

    @PostMapping("/rule-chains/{ruleChainId}/metadata")
    public ResponseEntity<Object> saveRuleChainMetadata(
            @RequestHeader("Authorization") String authToken,
            @PathVariable String ruleChainId,
            @RequestBody Map<String, Object> metadata) {

        Object savedMetadata = thingsBoardService.saveRuleChainMetadata(authToken, ruleChainId, metadata);
        return savedMetadata != null ?
                ResponseEntity.ok(savedMetadata) :
                ResponseEntity.badRequest().build();
    }

    // Device Attributes endpoints

    @GetMapping("/devices/{deviceId}/attributes/{scope}")
    public ResponseEntity<List<Object>> getDeviceAttributes(
            @RequestHeader("Authorization") String authToken,
            @PathVariable String deviceId,
            @PathVariable String scope) {

        List<Object> attributes = thingsBoardService.getDeviceAttributes(authToken, deviceId, scope);
        return ResponseEntity.ok(attributes);
    }



}
