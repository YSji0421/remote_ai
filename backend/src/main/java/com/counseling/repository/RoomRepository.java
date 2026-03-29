package com.counseling.repository;

import com.counseling.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByLivekitRoomName(String livekitRoomName);
}
