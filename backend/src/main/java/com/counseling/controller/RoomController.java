package com.counseling.controller;

import com.counseling.dto.RoomDto;
import com.counseling.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    // 새 상담방 생성
    @PostMapping
    public ResponseEntity<RoomDto.RoomResponse> createRoom(@Valid @RequestBody RoomDto.CreateRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (String) auth.getPrincipal();
        RoomDto.RoomResponse response = roomService.createRoom(request.getTitle(), userEmail);
        return ResponseEntity.ok(response);
    }

    // 활성 상담방 목록 조회 (로비 화면 — 3초마다 프론트에서 폴링)
    @GetMapping
    public ResponseEntity<List<RoomDto.RoomListItem>> listRooms() {
        return ResponseEntity.ok(roomService.listActiveRooms());
    }

    // 특정 방의 LiveKit 입장 토큰 발급
    @GetMapping("/{roomName}/token")
    public ResponseEntity<Map<String, String>> getJoinToken(@PathVariable String roomName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (String) auth.getPrincipal();
        String token = roomService.getJoinToken(roomName, userEmail);
        return ResponseEntity.ok(Map.of("token", token));
    }
}
