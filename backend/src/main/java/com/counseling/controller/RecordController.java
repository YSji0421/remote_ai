package com.counseling.controller;

import com.counseling.dto.RecordRequest;
import com.counseling.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    @PostMapping("/save")
    public ResponseEntity<String> saveRecord(@RequestBody RecordRequest request) {
        try {
            recordService.saveEncryptedRecord(
                    request.getRoomName(),
                    request.getTranscript(),
                    request.getSummary()
            );
            return ResponseEntity.ok("Record saved securely");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to encrypt and save record");
        }
    }
}
