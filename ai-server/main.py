import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"

# .env 파일에서 환경변수(API 키 등) 자동 로딩
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import shutil
import uuid

from stt_engine import STTEngine
from gemini_service import GeminiService

app = FastAPI(title="AI 원격 상담 STT 서버", version="2.0")

# 리액트(Vite) 개발 포트와 통신하기 위한 전역 CORS 해제 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Whisper 추론 엔진 싱글톤 인스턴스
stt_engine = STTEngine()
# Gemini 프롬프트 엔진
gemini_service = GeminiService()

# 임시 저장 디렉토리 생성
os.makedirs("tmp", exist_ok=True)

@app.post("/api/analyze-record")
async def analyze_record(audio_file: UploadFile = File(...)):
    """
    클라이언트에서 통화 종료 시 던져주는 한 덩어리의 WebM/WAV 녹음 파일을 받아,
    STT로 텍스트를 추출하고 Gemini로 요약한 뒤 원본 오디오를 삭제합니다.
    """
    file_extension = audio_file.filename.split(".")[-1]
    temp_file_path = f"tmp/{uuid.uuid4()}.{file_extension}"
    
    try:
        # 1. 파일 임시 다운로드
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
            
        print(f"분석 시작: {temp_file_path} (용량 측정 중...)")
            
        # 2. STT 변환 (Faster Whisper - File Batch)
        transcript = await stt_engine.process_audio_file(temp_file_path)
        print("STT 추출 성공! 텍스트 길이:", len(transcript))
        
        # 3. Gemini 요약 리포트 생성
        summary = gemini_service.generate_counseling_summary(transcript)
        print("Gemini 요약 성공!")
        
        return {
            "transcript": transcript,
            "summary": summary
        }
        
    except Exception as e:
        print(f"분석 중 에러 발생: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
        
    finally:
        # 4. 파일 삭제 보장 (가장 중요한 보안 요구사항)
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"보안 파기 완료 (파일 삭제됨): {temp_file_path}")
            except Exception as e:
                print(f"파일 삭제 실패 (권한 문제일 수 있음): {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
