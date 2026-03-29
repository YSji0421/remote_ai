package com.counseling.controller;

import com.counseling.dto.AuthDto;
import com.counseling.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 로그인 / 회원가입 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody AuthDto.SignupRequest request) {
        authService.signup(request);
        return ResponseEntity.ok("회원가입이 완료되었습니다."); 
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        String token = authService.login(request);
        
        // plan.md 보안 요구사항: 프론트 localStorage 탈취를 회피하는 HttpOnly 쿠키 리스폰스.
        // Javascript에서는 이 쿠키에 접근할 수 없으며 요청 시 자동 포함됨.
        ResponseCookie cookie = ResponseCookie.from("counseling_token", token)
                .httpOnly(true)
                .secure(false) // HTTPS 적용 시에만 true. 로컬(http)에서는 false
                .path("/")
                .maxAge(86400) // 수명 24시간
                .sameSite("Lax") // 프론트 로컬호스트 통신용 SameSite 정책
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("로그인 성공 (HttpOnly JWT 토큰 발급 완료)");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // 즉각 만료시키는 빈 쿠키 덮어씌움
        ResponseCookie cookie = ResponseCookie.from("counseling_token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0) 
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("안전하게 로그아웃 되었습니다.");
    }
}
