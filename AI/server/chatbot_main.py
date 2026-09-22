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

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import requests
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

from Feely_ChatBot import FeelySession, call_feely  # noqa: E402  (경로 설정 이후에 import해야 함)

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

# 상담 시작~종료까지 쌓아둘 데이터 (시작 시각, 시작 이미지, 프레임별 감정분석 결과)
# 이것도 chat_sessions와 마찬가지로 메모리 저장이라 서버 재시작하면 초기화됨
counsel_sessions: dict[str, dict] = {}

# 한국 표준시(KST, UTC+9) - DST가 없는 나라라 고정 오프셋으로 충분함 (zoneinfo/tzdata 의존성 불필요)
KST = timezone(timedelta(hours=9))

# Spring 백엔드 주소 - 배포 환경 등에서 바뀔 수 있어 환경변수로 덮어쓸 수 있게 함
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8079")

EMOTION_KEYS = ["e01", "e02", "e03", "e04", "e05", "e06"]


class ChatRequest(BaseModel):
    sessionId: str  # 프론트에서 상담 시작 시 발급하는 대화 식별자 (예: crypto.randomUUID())
    message: str    # 사용자가 입력한 메시지


class ChatResponse(BaseModel):
    reply: str


class CounselStartRequest(BaseModel):
    sessionId: str
    startImagePath: Optional[str] = None  # 상담 시작 시점 캡처 이미지(base64)


class EmotionSampleRequest(BaseModel):
    sessionId: str
    scores: dict[str, float]  # 프레임 하나를 분석한 결과 (키: e01~e06)


class CounselFinishRequest(BaseModel):
    sessionId: str
    memberId: str                          # 로그인 아이디 (백엔드가 이 값으로 회원을 조회함)
    endImagePath: Optional[str] = None      # 상담 종료 시점 캡처 이미지(base64)
    status: str = "COMPLETED"              # 정상 종료: COMPLETED, 브라우저 이탈: ABORTED (프론트가 지정)


class CounselFinishResponse(BaseModel):
    counselFlag: bool
    message: Optional[str] = None


def _average_emotion_scores(samples: list) -> dict:
    """세션 동안 쌓인 프레임별 감정점수 리스트를 e01~e06 평균으로 압축함.
    샘플이 하나도 없으면(카메라를 안 켰거나 분석 서버가 응답이 없었던 경우)
    백엔드가 6개 값을 모두 요구하므로 0.0으로 채워서 보냄.
    """
    if not samples:
        return {key: 0.0 for key in EMOTION_KEYS}

    sums = {key: 0.0 for key in EMOTION_KEYS}
    counts = {key: 0 for key in EMOTION_KEYS}

    for sample in samples:
        for key in EMOTION_KEYS:
            value = sample.get(key)
            if value is not None:
                sums[key] += value
                counts[key] += 1

    return {
        key: (sums[key] / counts[key] if counts[key] > 0 else 0.0)
        for key in EMOTION_KEYS
    }


SUMMARY_SYSTEM_PROMPT = (
    "너는 방금 끝난 심리상담 대화를 기록용으로 요약하는 도우미야. "
    "환자(사용자)가 이번 상담에서 어떤 이야기를 했고 어떤 감정을 느꼈는지, "
    "상담사가 어떻게 반응했는지를 3~5문장의 한국어 존댓말로 담백하게 요약해. "
    "진단이나 평가하는 표현은 쓰지 말고, 실제 대화 내용을 근거로만 작성해."
)


def _summarize_session(session: Optional[FeelySession]) -> str:
    """상담 대화 히스토리를 바탕으로 짧은 상담 요약을 생성함.
    대화가 비어있으면(채팅 없이 바로 종료한 경우) 굳이 Claude를 호출하지 않음.
    """
    if session is None or not session.history:
        return ""

    try:
        return call_feely(
            SUMMARY_SYSTEM_PROMPT,
            session.history + [{"role": "user", "content": "지금까지 상담 내용을 요약해줘."}],
            max_tokens=400,
        )
    except Exception as err:
        # 요약 생성에 실패해도 상담 저장 자체는 막지 않고 빈 문자열로 진행함
        print(f"상담 요약 생성 실패: {err}")
        return ""


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


@app.post("/counsel/start")
def counsel_start(data: CounselStartRequest):
    # 상담이 실제로 시작되는 시점(카메라 사용 여부 선택 직후)에 프론트가 호출함
    # 시작 시각/시작 이미지를 여기서 기록해뒀다가 상담 종료 시 그대로 사용함
    counsel_sessions[data.sessionId] = {
        "startTime": datetime.now(KST),
        "startImagePath": data.startImagePath,
        "emotionSamples": [],
    }
    return {"ok": True}


@app.post("/counsel/emotion-sample")
def counsel_emotion_sample(data: EmotionSampleRequest):
    # 상담 중 5초마다 프론트가 카메라 프레임 분석 결과(/emotion 응답)를 그대로 넘겨줌
    # -> 세션별로 누적해뒀다가 상담 종료 시 평균을 냄
    session_data = counsel_sessions.setdefault(
        data.sessionId,
        {"startTime": datetime.now(KST), "startImagePath": None, "emotionSamples": []},
    )
    session_data["emotionSamples"].append(data.scores)
    return {"ok": True}


@app.post("/counsel/finish", response_model=CounselFinishResponse)
def counsel_finish(data: CounselFinishRequest):
    # 상담 종료 버튼을 누르면 프론트가 호출함
    # 여기서 요약/감정평균을 계산해서 Spring 백엔드(/api/counsel)로 직접 전송함
    session_data = counsel_sessions.pop(
        data.sessionId,
        {"startTime": datetime.now(KST), "startImagePath": None, "emotionSamples": []},
    )
    chat_session = chat_sessions.get(data.sessionId)

    payload = {
        "memberId": data.memberId,
        "counselDate": session_data["startTime"].strftime("%Y-%m-%d %H:%M:%S"),
        "summary": _summarize_session(chat_session),
        "emotionScore": _average_emotion_scores(session_data["emotionSamples"]),
        "startImagePath": session_data["startImagePath"],
        "endImagePath": data.endImagePath,
        "status": data.status,
    }

    try:
        response = requests.post(
            f"{BACKEND_BASE_URL}/api/counsel",
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
        return CounselFinishResponse(counselFlag=bool(result.get("counselFlag")))
    except Exception as err:
        print(f"백엔드로 상담 데이터 전송 실패: {err}")
        return CounselFinishResponse(counselFlag=False, message=str(err))
