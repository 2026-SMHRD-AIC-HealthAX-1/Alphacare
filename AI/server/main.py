# FastAPI라는 서버 제작 도구를 가져오기
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# FastAPI를 이용해서 서버 객체를 만들기
app = FastAPI()

# Feely 홈페이지가 FastAPI 서버에 요청할 수 있도록 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /emotion API가 받을 데이터의 모양을 정의
class EmotionRequest(BaseModel):
    name: str

# 나중에 실제 PyTorch 감정모델이 들어갈 자리
def predict_emotion():
    return {
        "emotion": "happy",
        "confidence": 0.87
    }

# /test 주소로 GET 요청이 들어오면 아래 함수를 실행
@app.get("/test")
def test_api():
    # 요청한 사람에게 결과를 돌려주기
    return {"message": "AlphaCare server is running!"}

    # 테스트용 감정분석 API
# 아직 실제 AI 모델은 연결하지 않음
@app.post("/emotion")
def emotion_api(data: EmotionRequest):

    result = predict_emotion()

    return {
        "received_name": data.name,
        "emotion": result["emotion"],
        "confidence": result["confidence"]
    }
