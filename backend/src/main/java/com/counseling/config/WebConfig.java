package com.counseling.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 전역 CORS(Cross-Origin Resource Sharing) 설정
 * 
 * plan.md 요구사항: 포트 번호가 다른 로컬 개발 특성상 React(Vite)와 Spring Boot 간의 
 * API 호출 시 발생하는 차단을 방지하기 위해 단일 글로벌 설정 도입.
 * 안전을 위해 * 와일드카드 대신 구체적인 로컬 포트 및 자격 증명(allowCredentials) 설정.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 API 엔드포인트에 적용
                .allowedOrigins(
                    "http://localhost:5173", // Vite 디폴트 로컬 포트
                    "http://127.0.0.1:5173",
                    "http://localhost:3000"  // 예비용 포트
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                // 프론트엔드쪽에서 HttpOnly Cookie 송수신을 허용하기 위해 반드시 true 설정 필요
                .allowCredentials(true)
                // 브라우저의 Preflight 캐시 시간 설정 (1시간)
                .maxAge(3600);
    }
}
