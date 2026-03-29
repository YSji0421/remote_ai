import os
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        # 윈도우 환경 변수 또는 서버 환경 변수에서 구글 API 키를 읽어옵니다.
        api_key = os.getenv("AIzaSyCzruEeYROj4LWm0cRUq0kjalJ5euEWmdY", "")
        if api_key:
            genai.configure(api_key=api_key)
            # 가성비와 속도가 우수한 gemini-1.5-flash 모델 사용
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            print("Gemini API가 성공적으로 연동되었습니다.")
        else:
            self.model = None
            print("=================================================================")
            print("WARNING: GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
            print("cmd 터미널에서 'set GEMINI_API_KEY=당신의_키'를 입력 후 서버를 켜주세요.")
            print("=================================================================")

    def generate_counseling_summary(self, transcript: str) -> str:
        if not self.model:
            return "Gemini API 키가 설정되지 않아 요약을 생성할 수 없습니다. (환경변수 GEMINI_API_KEY 등록 필요)"
        
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
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini 요약 중 에러 발생: {e}")
            return f"요약 생성 실패: {str(e)}"
