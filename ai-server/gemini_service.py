import os
from google import genai

class GeminiService:
    def __init__(self):
        # .env 파일의 GEMINI_API_KEY 값을 읽어옵니다.
        # ⚠️ 절대 API 키 문자열을 코드 안에 직접 적지 마세요! (Git 유출 위험)
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            # 최신 google-genai SDK 방식 (구버전: google.generativeai → 신버전: google.genai)
            self.client = genai.Client(api_key=api_key)
            print("Gemini API가 성공적으로 연동되었습니다. (신규 SDK 사용)")
        else:
            self.client = None
            print("=================================================================")
            print("WARNING: GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
            print("=================================================================")

    def generate_counseling_summary(self, transcript: str) -> str:
        if not self.client:
            return "Gemini API 키가 설정되지 않아 요약을 생성할 수 없습니다."
        
        if not transcript or len(transcript.strip()) < 5:
            return "대화 내용이 너무 짧아 요약할 수 없습니다."

        prompt = f"""
당신은 전문 심리 상담사입니다. 아래는 오늘 진행된 원격 심리 상담의 전체 녹취록입니다.
내담자의 주요 증상, 감정 상태, 그리고 제공해야 할 핵심 솔루션(조언)을 각각 1~2줄로 명확하고 따뜻하게 요약해 주세요.

[상담 녹취록 시작]
{transcript}
[상담 녹취록 끝]

다음 양식에 맞춰 깔끔하게 작성해 주세요:
- 주요 증상 및 호소 내용: 
- 내담자의 감정 상태: 
- 추천 솔루션 및 다음 상담 방향: 
"""
        try:
            # 최신 google-genai SDK 호출 방식
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-preview-03-25",
                contents=prompt,
            )
            return response.text
        except Exception as e:
            print(f"Gemini 요약 중 에러 발생: {e}")
            return f"요약 생성 실패: {str(e)}"
