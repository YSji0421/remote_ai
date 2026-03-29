package com.counseling.service;

import com.counseling.domain.Record;
import com.counseling.domain.Room;
import com.counseling.repository.RecordRepository;
import com.counseling.repository.RoomRepository;
import com.counseling.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final RecordRepository recordRepository;
    private final RoomRepository roomRepository;
    private final EncryptionUtil encryptionUtil;

    @Transactional
    public void saveEncryptedRecord(String roomName, String transcript, String summary) {
        Room room = roomRepository.findByLivekitRoomName(roomName)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다: " + roomName));

        // 민감한 정보 AES-256 암호화 처리 (의료데이터 보안)
        String encryptedTranscript = encryptionUtil.encrypt(transcript);
        String encryptedSummary = encryptionUtil.encrypt(summary);

        Record record = Record.builder()
                .room(room)
                .encryptedTranscript(encryptedTranscript)
                .encryptedAiSummary(encryptedSummary)
                .build();

        recordRepository.save(record);
    }
}
