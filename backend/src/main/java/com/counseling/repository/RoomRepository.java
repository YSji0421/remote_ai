package com.counseling.repository;

import com.counseling.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByLivekitRoomName(String livekitRoomName);

    // 활성화된 방 전체를 최신순으로 조회 (로비 화면용)
    List<Room> findAllByActiveTrueOrderByCreatedAtDesc();
}
