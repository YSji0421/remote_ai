package com.counseling.repository;

import com.counseling.domain.Record;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RecordRepository extends JpaRepository<Record, Long> {
    Optional<Record> findByRoomId(Long roomId);

    // 특정 사용자(owner 또는 client)가 참여한 방의 모든 기록을 최신순으로 정렬하여 조회
    @Query("SELECT r FROM Record r WHERE r.room.owner.id = :userId OR r.room.client.id = :userId ORDER BY r.createdAt DESC")
    List<Record> findAllByParticipantId(@Param("userId") Long userId);
}
