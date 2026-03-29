package com.counseling.controller;

import com.counseling.dto.RecordDto;
import com.counseling.dto.RecordRequest;
import com.counseling.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    // 상담 기록 저장 (FastAPI AI 서버 → 프론트 → 여기로 전달)
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

    // 내 상담 기록 목록 조회 (로그인한 사용자의 JWT에서 이메일 추출)
    @GetMapping("/my")
    public ResponseEntity<List<RecordDto.Summary>> getMyRecords(Principal principal) {
        try {
            List<RecordDto.Summary> records = recordService.getMyRecords(principal.getName());
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 특정 기록 상세 조회 (복호화 + 본인 소유 확인)
    @GetMapping("/{id}")
    public ResponseEntity<RecordDto.Detail> getRecordDetail(@PathVariable Long id, Principal principal) {
        try {
            RecordDto.Detail detail = recordService.getRecordDetail(id, principal.getName());
            return ResponseEntity.ok(detail);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
