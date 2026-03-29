package com.counseling.service;

import com.counseling.domain.User;
import com.counseling.dto.AuthDto;
import com.counseling.repository.UserRepository;
import com.counseling.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // SecurityConfig의 BCrypt 빈 주입
    private final JwtUtil jwtUtil;

    @Transactional
    public void signup(AuthDto.SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(User.Role.USER) // 기본 유저 롤 무조건 부여
                .build();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public String login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일이거나 비밀번호가 틀렸습니다."));
        
        // BCrypt 비교 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("가입되지 않은 이메일이거나 비밀번호가 틀렸습니다.");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }
}
