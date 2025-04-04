package io.iotdevicemanagement.service;

import io.iotdevicemanagement.dto.*;
import io.iotdevicemanagement.exception.AuthenticationException;
import io.iotdevicemanagement.dto.PageData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.thingsboard.server.common.data.Device;
import org.thingsboard.server.common.data.alarm.Alarm;

import java.util.*;


@Service
public class ThingsBoardService {

    @Value("${thingsboard.url}")
    private String thingsboardUrl;

    @Autowired
    private WebClient webClient;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final Logger log = LoggerFactory.getLogger(ThingsBoardService.class);

    public AuthResponse authenticate(String email, String password) throws AuthenticationException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String requestBody = String.format(
                "{\"username\":\"%s\",\"password\":\"%s\"}",
                email,
                password
        );

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    thingsboardUrl + "/api/auth/login",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class
            );

            String responseBody = response.getBody();
            return parseAuthResponse(responseBody);
        } catch (HttpClientErrorException e) {
            throw new AuthenticationException("Thingsboard authentication failed");
        }
    }

    private AuthResponse parseAuthResponse(String responseBody) {
        String token = responseBody.split("\"token\":\"")[1].split("\"")[0];
        String refreshToken = responseBody.split("\"refreshToken\":\"")[1].split("\"")[0];
        return new AuthResponse(token, refreshToken);
    }

    public List<Object> getDevices(String authToken, int pageSize, int page) {
        HttpHeaders headers = createAuthHeaders(authToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = String.format(
                "http://localhost:8080/api/tenant/deviceInfos?pageSize=%d&page=%d&sortProperty=createdTime&sortOrder=DESC",
                pageSize,
                page
        );

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        Map<String, Object> responseBody = response.getBody();
        if (response.getBody() != null) {
            Object data = response.getBody().get("data");
            if (data instanceof List) {
                return (List<Object>) data;
            }
        }
        return Collections.emptyList();
    }

    public Object getDeviceInfo(String deviceId,String authToken) {
        try {
            String url = String.format("%s/api/device/info/%s", "http://localhost:8080", deviceId);
            HttpHeaders headers = createAuthHeaders(authToken);
            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Object.class);

            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch device info", e);
        }
    }

    public List<Alarm> getDeviceAlarms(String deviceId,String authToken) {
        HttpHeaders headers = createAuthHeaders(authToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = String.format("%s/api/alarm/DEVICE/%s?pageSize=100&page=0",
                "http://localhost:8080", deviceId);

        ResponseEntity<PageData<Alarm>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<>() {});

        return response.getBody().getData();
    }

    public String getDeviceHealth(String deviceId,String authToken) {
        try {
            Object deviceInfo = getDeviceInfo(deviceId, authToken);
            if (deviceInfo instanceof Map) {
                Map<String, Object> deviceInfoMap = (Map<String, Object>) deviceInfo;
                Boolean isActive = (Boolean) deviceInfoMap.get("active");
                return isActive != null && isActive ? "Active" : "Inactive";
            }
            return "Unavailable";
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch device health", e);
        }
    }


    public List<Object> getRuleChains(String authToken, int pageSize, int page) {
        HttpHeaders headers = createAuthHeaders(authToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = String.format(
                "http://localhost:8080/api/ruleChains?pageSize=%d&page=%d",
                pageSize,
                page
        );

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                Object data = responseBody.get("data");
                if (data instanceof List) {
                    return (List<Object>) data;
                }
            }
        } catch (Exception e) {
            // Log the error appropriately
            System.err.println("Error fetching rule chains: " + e.getMessage());
        }

        return Collections.emptyList();
    }

    public Object createRuleChain(String authToken, Object ruleChainConfig) {
        HttpHeaders headers = createAuthHeaders(authToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(ruleChainConfig, headers);

        String url = "http://localhost:8080" + "/api/ruleChain";

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Object.class
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error creating rule chain: " + e.getMessage());
            return null;
        }
    }

    public boolean deleteRuleChain(String authToken, String ruleChainId) {
        HttpHeaders headers = createAuthHeaders(authToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = "http://localhost:8080" + "/api/ruleChain/" + ruleChainId;

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
            return true;
        } catch (Exception e) {
            System.err.println("Error deleting rule chain: " + e.getMessage());
            return false;
        }
    }

    public Object getRuleChainMetadata(String authToken, String ruleChainId) {
        HttpHeaders headers = createAuthHeaders(authToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = "http://localhost:8080" + "/api/ruleChain/" + ruleChainId + "/metadata";

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Object.class
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error fetching rule chain metadata: " + e.getMessage());
            return null;
        }
    }

    public Object saveRuleChainMetadata(String authToken, String ruleChainId, Object metadata) {
        HttpHeaders headers = createAuthHeaders(authToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(metadata, headers);

        String url = "http://localhost:8080" + "/api/ruleChain/" + ruleChainId + "/metadata";

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Object.class
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error saving rule chain metadata: " + e.getMessage());
            return null;
        }
    }

    public List<Object> getDeviceAttributes(String authToken, String deviceId, String scope) {
        HttpHeaders headers = createAuthHeaders(authToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = "http://localhost:8080" + "/api/plugins/telemetry/DEVICE/" + deviceId + "/values/attributes/" + scope;

        try {
            ResponseEntity<List<Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error fetching device attributes: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private HttpHeaders createAuthHeaders(String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Authorization", authToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

}