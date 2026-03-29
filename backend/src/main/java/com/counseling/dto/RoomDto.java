package com.counseling.dto;

import jakarta.validation.constraints.NotBlank;
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
}
