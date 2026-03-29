package com.counseling.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * AES-256 양방향 암호화 모듈
 * 
 * plan.md 요구사항: 상담 내용(대본 및 요약본) 등 민감한 텍스트 데이터의
 * 완벽한 보안 유지를 위해 DB 저장 전 암호화(Encrypt) 및 조회 시 복호화(Decrypt) 수행.
 */
@Component
public class EncryptionUtil {
    
    // DB 암호화에 사용할 시크릿 키 (JWT 시크릿을 재활용하거나 별도로 지정 가능)
    @Value("${jwt.secret}")
    private String secretKey;

    private static final String ALGORITHM = "AES";

    public String encrypt(String rawText) {
        if (rawText == null || rawText.isEmpty()) return rawText;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(generate32ByteKey(secretKey), ALGORITHM);
            // AES/ECB/PKCS5Padding is the default for Cipher.getInstance("AES")
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            byte[] encrypted = cipher.doFinal(rawText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Data Encryption failed for sensitive text", e);
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) return encryptedText;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(generate32ByteKey(secretKey), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Data Decryption failed for sensitive text", e);
        }
    }

    // AES-256 암호화를 위해서는 32 Byte(256 Bits) 길이의 키가 필요함.
    private byte[] generate32ByteKey(String key) {
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
        byte[] finalKey = new byte[32];
        System.arraycopy(keyBytes, 0, finalKey, 0, Math.min(keyBytes.length, 32));
        return finalKey;
    }
}
