import os
from faster_whisper import WhisperModel
import asyncio

# 서버 사양에 맞춰 교체 (한국어의 복잡한 문맥을 완벽히 이해하는 medium 모델 적용)
MODEL_SIZE = "medium"

class STTEngine:
    def __init__(self):
        # AI 모델 메모리 로딩. CUDA(그래픽카드)가 없거나 세팅이 안 된 환경을 대비해 자동 폴백 지원.
        try:
            self.model = WhisperModel(MODEL_SIZE, device="cuda", compute_type="float16")
            print(f"Faster-Whisper ({MODEL_SIZE}) loaded on CUDA (GPU Accelerate).")
        except Exception as e:
            print(f"CUDA initialization failed ({e}), loading on CPU instead...")
            self.model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    async def process_audio_file(self, file_path: str) -> str:
        """
        단일 오디오 파일을 읽어들여 전체 STT 트랜스크립션을 추출합니다.
        I/O 블로킹 방지를 위해 비동기 백그라운드 태스크로 연산을 위임합니다.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._transcribe_sync, file_path)

    def _transcribe_sync(self, file_path: str) -> str:
        # 파일 경로를 직접 넘기면 내부적으로 ffmpeg(PyAV)을 통해 디코딩 후 변환합니다.
        segments, info = self.model.transcribe(
            file_path, 
            beam_size=5, 
            vad_filter=True, 
            language="ko", # 한국어 상담 고정
            initial_prompt="안녕하세요. AI 기반 원격 심리 상담을 시작하겠습니다. 환자분께서는 편안하고 차분하게, 존댓말로 증상이나 고민을 자세히 말씀해 주시면 됩니다."
        )
        
        # 추후 화자 분리(Diarization) 적용을 위해 segments 자체를 순회할 수 있으나, 
        # 현 단계에서는 단순 텍스트 Join 형태로 반환합니다. 
        # (확장성: 향후 반환값을 List[Dict] 형태로 변경하여 화자를 추정할 수 있습니다.)
        
        return " ".join([segment.text for segment in segments]).strip()
