package com.counseling.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 상담 기록 조회용 DTO
 * - Summary: 목록 화면 (요약 미리보기만)
 * - Detail: 상세 화면 (전문 + 요약 전체)
 */
public class RecordDto {

    @Data @Builder
    public static class Summary {
        private Long id;
        private String roomTitle;
        private String createdAt;
        private String summaryPreview; // AI 요약 (복호화 완료)
    }

    @Data @Builder
    public static class Detail {
        private Long id;
        private String roomTitle;
        private String createdAt;
        private String transcript;  // 전체 녹취록 (복호화 완료)
        private String summary;     // AI 요약 (복호화 완료)
    }
}
