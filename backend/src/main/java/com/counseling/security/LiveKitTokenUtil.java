package com.counseling.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * LiveKit Cloud JWT 생성 유틸 (무료 플랜 클라우드 서버와 통신)
 * 
 * plan.md 요구사항: 백엔드에서 보안 검증 이후 프론트로 입장 티켓을 구워줌.
 */
@Component
public class LiveKitTokenUtil {

    private final String apiKey;
    private final SecretKey key;

    public LiveKitTokenUtil(@Value("${livekit.api-key}") String apiKey,
                            @Value("${livekit.api-secret}") String apiSecret) {
        this.apiKey = apiKey;
        
        // LiveKit API Secret 길이는 44자 이상이므로 jjwt의 32바이트 최소 요건을 자연히 충족합니다.
        // 기존의 32바이트 강제 절삭 로직이 서명 불일치를 유발하여 이를 원본 그대로 사용하도록 픽스합니다.
        this.key = Keys.hmacShaKeyFor(apiSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String roomName, String participantIdentity, String participantName) {
        // LiveKit의 Video Grant 규격을 맞춰 JWT를 조립
        Map<String, Object> videoGrant = new HashMap<>();
        videoGrant.put("room", roomName);
        videoGrant.put("roomJoin", true);

        return Jwts.builder()
                .issuer(apiKey)                     // JWT의 iss (LiveKit API Key)
                .subject(participantIdentity)       // JWT의 sub (유저 고유 식별자)
                .claim("name", participantName)     // 화면에 표시될 닉네임
                .claim("video", videoGrant)         // LiveKit 특화 권한 Grant
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600 * 1000)) // 티켓 유효시간 1시간
                .signWith(key)
                .compact();
    }
}
