# AI 원격 상담 솔루션 웹 플랫폼 상세 개발 플랜 (plan.md)

## 0. 최종 확정된 기술 스택 및 개발 환경 (버전 고정)
안정적인 상용 수준의 마이크로서비스 연동을 위해, 설계된 모든 의존성의 버전을 구체적으로 고정(Lock)합니다.

* **운영 인프라 및 엔진 (Local & Target)**
  - Windows / NVIDIA RTX 4070 Ti Super
  - 환경 버전: `Java 17 LTS`, `Python 3.11`, `Node.js 20 LTS`
  - GPU 코어 가속: `CUDA Toolkit 12.1` + `cuDNN 8.9.x`
  - 서버 저장소: `PostgreSQL 16.x`, `Redis 7.2.x`

* **Frontend (React/Vite)**
  - 기술: React 18.x / Vite 5.x / Tailwind CSS 3.x / Web Audio API 활용
  - WebRTC 연동: `@livekit/components-react` 2.x / `@livekit/client` 2.x

* **Backend (Spring Boot Java)**
  - 기술: Spring Boot 3.2.x / Gradle 8.x
  - 보안 및 통신: jjwt 0.12.x / Bucket4j 8.x / PostgreSQL Driver 42.7.x / LiveKit REST 연동

* **AI Server (Python FastAPI)**
  - 기술: FastAPI 0.111.x / uvicorn 0.29.x / websockets 12.x
  - 추론 엔진: `faster-whisper` 1.0.x / `torch` 2.3.x+cu121 / `pyannote.audio` 3.x

---

## 1. 전체 디렉토리 아키텍처 (폴더 구조)
각자의 책임이 완벽히 분리된 3개의 마이크로서비스 생태계로 운용합니다.

```text
ai-counseling-platform/
├── frontend/                 # React (Vite) 프론트엔드
│   ├── src/
│   │   ├── components/       # 화상 회의 및 공통 단위 UI
│   │   ├── pages/            # 라우팅 적용 진입 페이지
│   │   ├── hooks/            # Web Audio API 캡처 및 전송 커스텀 훅
│   │   └── api/              # Spring Boot 및 FastAPI 통신 모듈
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Spring Boot (Java) 핵심 비즈니스 서버
│   ├── src/main/java/com/counseling/
│   │   ├── config/           # Security, DB 설정, HttpOnly JWT, CORS 통신(WebConfig), Rate Limit 세팅
│   │   ├── domain/           # JPA 엔티티 및 DTO
│   │   ├── controller/       # 권한 검증 기반 REST API
│   │   ├── service/          # LiveKit Token 통신, DB 자격 검증, Gemini 호출 로직
│   │   └── util/             # AES-256 양방향 암호화 모듈
│   ├── build.gradle
│   └── application.yml
│
└── ai-server/                # FastAPI (Python) STT 전용 AI 엔진 서버
    ├── main.py               # WebSocket 통신 진입점 (연결 전 인증 심사 포함)
    ├── stt_engine.py         # faster-whisper(CUDA) 및 VAD(음성 감지) 로직
    ├── requirements.txt
    └── .env
```

---

## 2. 단계별 상세 구현 로드맵 (Phases)

### 🚀 Phase 1: 기본 인프라 세팅 및 권한(Auth) 시스템
1. **프로젝트 리포지토리 구성 및 통신(CORS) 세팅 확립**
   - 3-Tier 아키텍처 폴더 뼈대 생성.
   - **(통신 보장)**: 포트 번호가 다른 로컬 개발 특성상 Vite(React)와 Spring Boot 간의 API 호출 시 발생하는 **CORS(Cross-Origin Resource Sharing) 충돌 위반 방지를 위해 `config/WebConfig.java`에 초기부터 글로벌 허용 도메인 매핑 추가.**
2. **분산 환경 데이터베이스 모델링 및 암호화 구현 (Spring Boot)**
   - `User`, `Room`, `Record` JPA 매핑 및 텍스트 데이터 **AES-256 양방향 암호화 Util** 개발.
3. **회원가입/로그인 및 HttpOnly JWT 발급**
   - Spring Security 연동 로그인. 프론트 `localStorage` 취약점을 피한 **HttpOnly Cookie** 방식의 JWT 쿠키 구워내기.

### 🎥 Phase 2: LiveKit Cloud 연동 및 엄격한 방 접근 제어
1. **WebRTC 미디어 중계 서버 (LiveKit Cloud Free) 셋팅**
   - 불필요한 인프라 오버헤드를 줄이기 위한 클라우드 API Key 발급 연결 세팅.
2. **참여자 권한(DB) 검증 기반 LiveKit Token 발급 로직**
   - 방에 입장하려는 자가 해당 Room의 실제 소속원인지 **Spring Boot에서 DB 교차 쿼리 검증**을 통해 신원 검사를 마친 사람만 라이브킷 입장 티켓(JWT) 발행.
3. **프론트엔드 화상 컴포넌트 개발 (React)**
   - 발급받은 쿠키와 티켓으로 화상방 UI 컴포넌트 마운트 및 장치 토글 개발.

### 🎙️ Phase 3: 실시간 음성-텍스트(STT) AI 파이프라인 (CUDA)
1. **Python FastAPI 및 faster-whisper 세팅**
   - 강력한 그래픽카드(CUDA 성능 100%) 기반 추론 엔진 마운팅.
2. **Web Audio API 오디오 캡처 및 FastAPI 소켓 인증 전송**
   - 브라우저 기능(Web Audio API)만으로 마이크 버퍼를 캡처해 FastAPI 소켓으로 다이렉트 푸시.
   - **(보안 로직 추가)**: 누구나 AI 서버 오디오 소켓에 무단 연결해 연산 리소스를 고갈시키는 행위를 방지하기 위해, 웹소켓 Handshake 과정에서 발급받은 **JWT나 Room Token 파라미터를 동봉토록 하고 Python FastAPI 백엔드가 이를 우선 검증(Verify) 및 Reject하는 인증 방어막(Auth Barrier)** 추가.
3. **실시간 텍스트 통신 지연시간 현실화 (0.5~1.0초 체감)**
   - VAD 버퍼링 대기 시간 + 네트워크 전송/회신 단계를 종합적으로 반영하여 전체 시스템 레이턴시 가이드라인을 0.5초~1초 대 현실화.

### 🤖 Phase 4: Gemini AI 요약 엔진 및 대시보드 마감
1. **대본 병합 및 프롬프트 엔지니어링 (Spring Boot)**
   - 방폭/통화 종료 감지 시 수집된 대본 병합. Gemini API로 구조화 프롬프트 호출.
2. **AI 요약 결과 수신 및 기록 관리 (React)**
   - Gemini 리턴 데이터 DB 암호화 적재 및 마이페이지 기록 열람 뷰/PDF 생성 적용.

---

## 3. 핵심 보안 및 안정성 가이드라인 (Security & Stability)
* **HTTPS 및 WSS 보안 프로토콜 강제 적용**
* **HttpOnly Cookie 보호 및 AI 소켓 진입 자격 검사**
* **Bucket4j 기반 서버 트래픽 통제 (Rate Limiting)**

## 4. 개발 착수 전 코드 규칙 가이드라인
* **읽기 쉬운 코드**: 단일 책임 분산, 추측 안해도 되는 투명한 변수명 작명.
* **설계 의도 주석화**: "CORS에서 와일드카드 사용을 자제한 이유", "WS 인증 방식 결정 이유" 등 목적 명시.
* **폴백/예외 플랜**: 메모리 누수(OOM), 네트워크 끊김 대비 우아한 복구(Fallback) 설계.
