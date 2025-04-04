package io.iotdevicemanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ThingsboardAuthResponse {
    @JsonProperty("token")
    private String token;

    @JsonProperty("refreshToken")
    private String refreshToken;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
