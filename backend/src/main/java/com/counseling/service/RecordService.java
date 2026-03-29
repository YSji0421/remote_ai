package com.counseling.service;

import com.counseling.domain.Record;
import com.counseling.domain.Room;
import com.counseling.domain.User;
import com.counseling.dto.RecordDto;
import com.counseling.repository.RecordRepository;
import com.counseling.repository.RoomRepository;
import com.counseling.repository.UserRepository;
import com.counseling.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final RecordRepository recordRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final EncryptionUtil encryptionUtil;

    // ──────────────────────────────────────────────────────
    // 상담 기록 저장 (암호화 후 DB 적재)
    // ──────────────────────────────────────────────────────
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

    // ──────────────────────────────────────────────────────
    // 내 상담 기록 목록 조회 (복호화 후 반환)
    // ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RecordDto.Summary> getMyRecords(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return recordRepository.findAllByOwnerId(user.getId())
                .stream()
                .map(r -> RecordDto.Summary.builder()
                        .id(r.getId())
                        .roomTitle(r.getRoom().getTitle())
                        .createdAt(r.getCreatedAt().toString())
                        // 목록에서는 요약만 복호화하여 미리보기로 제공 (전문은 상세 조회 시)
                        .summaryPreview(encryptionUtil.decrypt(r.getEncryptedAiSummary()))
                        .build())
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────
    // 특정 기록 상세 조회 (전문 + 요약 완전 복호화)
    // ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public RecordDto.Detail getRecordDetail(Long recordId, String userEmail) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        // 본인 소유 기록인지 검증 (타인의 상담 내용 열람 방지)
        if (!record.getRoom().getOwner().getEmail().equals(userEmail)) {
            throw new SecurityException("해당 기록에 대한 접근 권한이 없습니다.");
        }

        return RecordDto.Detail.builder()
                .id(record.getId())
                .roomTitle(record.getRoom().getTitle())
                .createdAt(record.getCreatedAt().toString())
                .transcript(encryptionUtil.decrypt(record.getEncryptedTranscript()))
                .summary(encryptionUtil.decrypt(record.getEncryptedAiSummary()))
                .build();
    }
}
