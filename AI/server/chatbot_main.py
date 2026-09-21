# -*- coding: utf-8 -*-
"""
chatbot_main.py

Feely 챗봇 전용 FastAPI 서버 (임시 작업용 파일).
팀원이 server/main.py에서 감정분석(/emotion) 쪽을 작업 중이라 그 파일은 건드리지 않고,
챗봇 기능만 여기서 따로 완성해둠. 팀원 작업 끝나면 아래 내용을
main.py에 그대로 옮겨 붙이면 됨 (import, CORS 설정, /chat 엔드포인트).

단독으로 바로 실행해서 테스트도 가능:
    uvicorn chatbot_main:app --reload --port 8000
"""

import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Feely_ChatBot.py는 ChatBot 폴더에 있음. 이 파일이 나중에 main.py로 옮겨져도
# 항상 정확히 찾을 수 있도록 실행 위치와 상관없이 절대경로로 계산함
CHATBOT_DIR = Path(__file__).resolve().parent.parent / "ChatBot"
sys.path.append(str(CHATBOT_DIR))

# Feely_ChatBot.py 내부에서도 load_dotenv(".APIenv")를 상대경로로 호출하는데,
# 실행 위치(cwd)에 따라 못 찾을 수 있어서 여기서 절대경로로 먼저 로드해둠
load_dotenv(dotenv_path=CHATBOT_DIR / ".APIenv")

from Feely_ChatBot import FeelySession  # noqa: E402  (경로 설정 이후에 import해야 함)

app = FastAPI()

# Feely 프론트엔드(로컬 개발 서버) 요청만 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 상담 세션별 대화 히스토리(FeelySession)를 메모리에 들고 있음
# 서버 재시작하면 초기화됨 - 여러 대에 나눠 돌리거나 오래 유지하려면 나중에 DB/Redis로 옮겨야 함
chat_sessions: dict[str, FeelySession] = {}


class ChatRequest(BaseModel):
    sessionId: str  # 프론트에서 상담 시작 시 발급하는 대화 식별자 (예: crypto.randomUUID())
    message: str    # 사용자가 입력한 메시지


class ChatResponse(BaseModel):
    reply: str


@app.get("/test")
def test_api():
    return {"message": "Feely AI 서버가 정상적으로 실행 중입니다!"}


@app.post("/chat", response_model=ChatResponse)
def chat_api(data: ChatRequest):
    # 처음 보는 sessionId면 새 상담 대화(FeelySession)를 새로 만듦
    if data.sessionId not in chat_sessions:
        chat_sessions[data.sessionId] = FeelySession()

    session = chat_sessions[data.sessionId]
    reply = session.send(data.message)

    return ChatResponse(reply=reply)
