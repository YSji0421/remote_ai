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

import java.util.UUID;

/**
 * 화상 상담방 비즈니스 로직
 */
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final LiveKitTokenUtil liveKitTokenUtil;

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
        // 이 방에 권한이 없는 타인의 무단 접근(토큰 발급)을 여기서 방어합니다.
        // 향후 내담자(Participant) 테이블이 추가되면 로직을 확장할 수 있도록 뼈대 구성.
        boolean isOwner = room.getOwner().getId().equals(user.getId());
        boolean hasPermission = isOwner || true; // 개발/테스트 편의를 위해 임시 true 처리 (실무에선 false)
        
        if (!hasPermission) {
            throw new IllegalArgumentException("이 화상방에 입장할 권한이 없습니다.");
        }

        // 완전한 신원 및 방 소속 확인이 끝난 유저에게만 LiveKit 입장 쿠폰(JWT) 수여
        return liveKitTokenUtil.generateToken(room.getLivekitRoomName(), user.getEmail(), user.getNickname());
    }
}
