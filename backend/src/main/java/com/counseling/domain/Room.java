package com.counseling.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 실시간 화상/음성 상담방 엔티티 (LiveKit Room과 1:1 매핑)
 * 
 * plan.md 요구사항: 권한 검증 기반 LiveKit Token 발급을 위해 
 * 이 방에 실제 소속된 사람인지를 DB 레벨에서 교차 검증해야 함
 */
@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "rooms")
public class Room {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // LiveKit 서비스에서 실제로 부여받는/사용하는 고유 Room ID
    @Column(unique = true, nullable = false)
    private String livekitRoomName;
    
    private String title;
    
    // 상담을 주관하는 방장 (상담사)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner; 

    // 내방객 (상담자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;
    
    private boolean active; // 현재 상담 진행(채널 열림) 여부
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    // 방폭/통화 종료 감지 시 기록됨
    private LocalDateTime endedAt;
}
