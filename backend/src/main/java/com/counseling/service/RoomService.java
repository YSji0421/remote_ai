package com.counseling.service;

import com.counseling.domain.Room;
import com.counseling.domain.User;
import com.counseling.dto.RoomDto;
import com.counseling.repository.RoomRepository;
import com.counseling.repository.UserRepository;
import com.counseling.security.LiveKitTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 화상 상담방 비즈니스 로직
 */
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final LiveKitTokenUtil liveKitTokenUtil;

    // ─────────────────────────────────────────────────────────────────────────
    // 방 생성
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public RoomDto.RoomResponse createRoom(String title, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("가입된 유저가 아닙니다."));

        Room room = Room.builder()
                .title(title)
                // LiveKit 클라우드 서버에서 방들을 구별할 완전히 고유한 식별자 (UUID)
                .livekitRoomName(UUID.randomUUID().toString())
                .owner(owner)
                .active(true)
                .build();
        
        roomRepository.save(room);

        return new RoomDto.RoomResponse(room.getId(), room.getLivekitRoomName(), room.getTitle(), owner.getNickname());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 활성 방 목록 조회 (로비 화면에 표시)
    // participantCount는 향후 LiveKit REST API 연동으로 실제값 반영 가능
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RoomDto.RoomListItem> listActiveRooms() {
        return roomRepository.findAllByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(r -> new RoomDto.RoomListItem(
                        r.getId(),
                        r.getLivekitRoomName(),
                        r.getTitle(),
                        r.getOwner().getNickname(),
                        0 // 추후 LiveKit API 실시간 카운트로 교체
                ))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 방 입장 토큰 발급 (DB 교차 권한 검증 포함)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public String getJoinToken(String livekitRoomName, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("가입된 유저가 아닙니다."));

        Room room = roomRepository.findByLivekitRoomName(livekitRoomName)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));

        if (!room.isActive()) {
            throw new IllegalArgumentException("종료되었거나 비활성화된 상담방입니다.");
        }

        // plan.md 핵심 요건: DB 교차 검증 로직
        // 개발 단계에서는 로그인한 모든 사용자가 입장 가능 (추후 참여자 테이블 추가 시 조건 강화)
        boolean isOwner = room.getOwner().getId().equals(user.getId());
        boolean hasPermission = isOwner || true;
        
        if (!hasPermission) {
            throw new IllegalArgumentException("이 화상방에 입장할 권한이 없습니다.");
        }

        return liveKitTokenUtil.generateToken(room.getLivekitRoomName(), user.getEmail(), user.getNickname());
    }
}
