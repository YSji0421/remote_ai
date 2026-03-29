package com.counseling.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * AI 요약 및 대본 녹취록을 보관하는 엔티티
 * 
 * plan.md 요구사항: 모든 구조화된 상담 내용(프롬프트 결과물 등)은
 * DB 적재 시 AES-256 양방향 암호화를 타야 함.
 */
@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "records")
public class Record {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 종료된 방과의 1:1 종속 관계
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    
    // STT 버퍼로 누적된 텍스트. 반드시 EncryptionUtil.encrypt() 후 Set 되어야 함
    @Column(columnDefinition = "TEXT")
    private String encryptedTranscript; 
    
    // Gemini API가 내려준 요약 결과. 반드시 EncryptionUtil.encrypt() 후 Set 되어야 함
    @Column(columnDefinition = "TEXT")
    private String encryptedAiSummary;  
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
