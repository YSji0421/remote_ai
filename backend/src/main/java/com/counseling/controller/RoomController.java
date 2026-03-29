package com.counseling.controller;

import com.counseling.dto.RoomDto;
import com.counseling.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 화상 상담방 REST API
 * (Security 필터에 의해 로그인한 유저의 HttpOnly 쿠키 인증이 완료된 상태에서만 호출됨)
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomDto.RoomResponse> createRoom(@Valid @RequestBody RoomDto.CreateRequest request) {
        // JwtAuthenticationFilter가 추출해서 넣어둔 이메일 정보를 꺼내씀
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (String) auth.getPrincipal(); 

        RoomDto.RoomResponse response = roomService.createRoom(request.getTitle(), userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomName}/token")
    public ResponseEntity<Map<String, String>> getJoinToken(@PathVariable String roomName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (String) auth.getPrincipal();

        // 방 소속 여부(DB 교차 쿼리) 검증을 거쳐서 이상이 없는 사람만 발급받는 티켓
        String token = roomService.getJoinToken(roomName, userEmail);

        return ResponseEntity.ok(Map.of("token", token));
    }
}
