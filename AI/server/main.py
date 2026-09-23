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

# 백엔드 통신 테스트용 가짜 감정 데이터
# 실제 AI 모델이 완성되면 실제 분석 결과로 교체할 예정
# ============================================================

@app.get("/emotion-test")
def emotion_test():

    # 6가지 감정의 테스트용 비율
    # 전체 합계는 100%
    return {
        "e01_rate": 20.0,
        "e02_rate": 45.0,
        "e03_rate": 10.0,
        "e04_rate": 5.0,
        "e05_rate": 12.0,
        "e06_rate": 8.0
    }

# PyTorch 감정모델 복원 테스트
import os
import torch
import torch.nn as nn


# 학습 때 사용한 모델 구조
class FeelyEmotionModel(nn.Module):

    def __init__(self):
        super().__init__()

        self.network = nn.Sequential(
            nn.Linear(10, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 6)
        )

    def forward(self, x):
        return self.network(x)


# main.py와 같은 폴더의 모델 파일 찾기
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "Feely_emotion_model.pt"
)


# 모델 파일 읽기
checkpoint = torch.load(
    MODEL_PATH,
    map_location="cpu",
    weights_only=False
)


# 모델 구조 만들기
emotion_model = FeelyEmotionModel()


# 학습된 가중치 넣기
emotion_model.load_state_dict(
    checkpoint["model_state_dict"]
)


# 추론 모드로 변경
emotion_model.eval()


print("Feely 감정모델 복원 성공")
print("모델 구조:", checkpoint["model_structure"])
print("입력 개수:", checkpoint["input_size"])
print("출력 감정 개수:", checkpoint["num_classes"])



# 테스트용 10개 변화값
test_feature = torch.zeros(10, dtype=torch.float32)

# 학습 때 사용한 평균과 표준편차
feature_mean = torch.tensor(
    checkpoint["feature_mean"],
    dtype=torch.float32
)

feature_std = torch.tensor(
    checkpoint["feature_std"],
    dtype=torch.float32
)

# 학습 때와 같은 방식으로 표준화
test_input = (
    test_feature - feature_mean
) / feature_std

# 모델에 넣을 수 있도록 모양 변경
test_input = test_input.unsqueeze(0)

# 실제 모델 추론
with torch.no_grad():
    logits = emotion_model(test_input)
    probabilities = torch.softmax(logits, dim=1)[0]

# 6감정 이름
emotion_names = [
    "중립",
    "기쁨",
    "슬픔",
    "분노",
    "당황",
    "불안"
]

print("6감정 테스트 결과")

for name, probability in zip(
    emotion_names,
    probabilities
):
    print(
        f"{name}: {probability.item() * 100:.2f}%"
    )

print(
    "합계:",
    f"{probabilities.sum().item() * 100:.2f}%"
)


# MediaPipe Face Landmarker 준비
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# main.py와 같은 폴더의 Face Landmarker 파일 찾기
# MediaPipe가 안정적으로 읽을 수 있는 짧은 경로
FACE_LANDMARKER_PATH = r"C:\face_landmarker.task"


# Face Landmarker 모델 파일 설정
base_options = python.BaseOptions(
    model_asset_path=FACE_LANDMARKER_PATH
)


# 얼굴 랜드마크 검출 옵션
landmarker_options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5
)


# Face Landmarker 생성
landmarker = vision.FaceLandmarker.create_from_options(
    landmarker_options
)


# VIDEO 모드 시간값
last_timestamp_ms = 0


print("Face Landmarker 생성 성공")
print("MediaPipe 버전:", mp.__version__)
print(
    "face_landmarker.task 존재:",
    os.path.exists(FACE_LANDMARKER_PATH)
)


# 얼굴 → 1434개 랜드마크 추출 준비
import cv2
import numpy as np
import time


def extract_landmark_feature(face_image):

    global last_timestamp_ms

    # 잘못된 이미지 확인
    if face_image is None:
        return None

    if face_image.size == 0:
        return None

    # OpenCV BGR → RGB
    rgb_image = cv2.cvtColor(
        face_image,
        cv2.COLOR_BGR2RGB
    )

    # NumPy → MediaPipe 이미지
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_image
    )

    # VIDEO 모드 시간값
    timestamp_ms = int(
        time.monotonic() * 1000
    )

    # 시간값은 항상 증가
    if timestamp_ms <= last_timestamp_ms:
        timestamp_ms = last_timestamp_ms + 1

    last_timestamp_ms = timestamp_ms

    # 얼굴 랜드마크 검출
    result = landmarker.detect_for_video(
        mp_image,
        timestamp_ms
    )

    # 얼굴을 못 찾은 경우
    if not result.face_landmarks:
        return None

    # 첫 번째 얼굴 사용
    landmarks = result.face_landmarks[0]

    # 478개 × x,y,z → 1434개
    feature = []

    for landmark in landmarks:
        feature.extend([
            landmark.x,
            landmark.y,
            landmark.z
        ])

    feature = np.array(
        feature,
        dtype=np.float32
    )

    return feature


# 1434개 랜드마크 위치·크기 보정
def make_ver5_base_feature(feature):

    # 입력 확인
    if feature is None:
        return None

    if feature.shape != (1434,):
        return None

    # 1434개 → 478개의 x, y, z
    landmarks = feature.reshape(
        478,
        3
    ).astype(
        np.float32
    )

    # 얼굴 중심 위치
    center_x = np.mean(
        landmarks[:, 0]
    )

    center_y = np.mean(
        landmarks[:, 1]
    )

    # 원본 보호
    relative_landmarks = landmarks.copy()

    # 얼굴 중심을 0으로 맞춤
    relative_landmarks[:, 0] -= center_x
    relative_landmarks[:, 1] -= center_y

    # 얼굴 가로 크기
    face_width = (
        np.max(landmarks[:, 0])
        - np.min(landmarks[:, 0])
    )

    # 얼굴 세로 크기
    face_height = (
        np.max(landmarks[:, 1])
        - np.min(landmarks[:, 1])
    )

    # 얼굴 크기 기준
    face_scale = max(
        face_width,
        face_height
    )

    # 비정상적인 얼굴 크기 방지
    if face_scale < 1e-6:
        return None

    # 얼굴 크기 차이 보정
    relative_landmarks[:, 0] /= face_scale
    relative_landmarks[:, 1] /= face_scale
    relative_landmarks[:, 2] /= face_scale

    # 478 × 3 → 1434개
    base_feature = relative_landmarks.reshape(
        -1
    ).astype(
        np.float32
    )

    # 잘못된 숫자 검사
    if not np.isfinite(base_feature).all():
        return None

    return base_feature


print("1434개 랜드마크 보정 함수 준비 성공")


