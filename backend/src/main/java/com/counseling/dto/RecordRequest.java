package com.counseling.dto;

import lombok.Data;

@Data
public class RecordRequest {
    private String roomName;
    private String transcript;
    private String summary;
}
