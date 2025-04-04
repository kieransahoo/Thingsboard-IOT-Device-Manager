package io.iotdevicemanagement.dto;

public class ErrorResponse {
    private String message;

    public ErrorResponse(String invalidCredentials) {
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
