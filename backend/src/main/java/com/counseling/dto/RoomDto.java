package com.counseling.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

public class RoomDto {
    @Getter @Setter
    public static class CreateRequest {
        @NotBlank
        private String title;
    }

    @Getter @Setter
    public static class RoomResponse {
        private Long roomId;
        private String livekitRoomName;
        private String title;
        private String ownerNickname;
        
        public RoomResponse(Long roomId, String livekitRoomName, String title, String ownerNickname) {
            this.roomId = roomId;
            this.livekitRoomName = livekitRoomName;
            this.title = title;
            this.ownerNickname = ownerNickname;
        }
    }

    // 로비에서 방 목록 카드에 보여줄 정보 (참여 인원수 포함)
    @Getter
    @AllArgsConstructor
    public static class RoomListItem {
        private Long roomId;
        private String livekitRoomName;
        private String title;
        private String ownerNickname;
        private int participantCount; // LiveKit Room API로 조회한 실시간 참여자 수
    }
}
