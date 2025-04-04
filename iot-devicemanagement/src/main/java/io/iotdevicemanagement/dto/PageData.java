package io.iotdevicemanagement.dto;

import lombok.Data;
import java.util.List;

@Data
public class PageData<T> {
    private List<T> data;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
}
