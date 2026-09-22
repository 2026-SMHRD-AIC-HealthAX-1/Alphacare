import { useState, useRef, useEffect } from "react";
import { sendChatMessage, checkServerHealth } from "../API/ai";
import { sendEmotionFrame } from "../API/emotion";
import {
  startCounselSession,
  sendEmotionSample,
  finishCounselSession,
  COUNSEL_ABORT_BEACON_URL,
} from "../API/counselSession";
import { saveCounselRecord } from "../API/counsel";
import { useNavigate } from "react-router-dom";
import FeelyLogo2 from "../assets/Feely_Logo_2.png";

// 4-4-4-4 박스 호흡법 단계 (각 4초씩 반복)
const BREATH_PHASES: { label: string; scale: string }[] = [
  { label: "천천히 숨을 들이쉬세요", scale: "scale-125" },
  { label: "잠시 멈추세요", scale: "scale-125" },
  { label: "천천히 숨을 내쉬세요", scale: "scale-75" },
  { label: "잠시 멈추세요", scale: "scale-75" },
];

// 빠른 답변 칩 목록 - text가 있으면 채팅 메시지로 바로 전송, action이 있으면 별도 동작(호흡 가이드 열기)을 함
const QUICK_REPLIES: { label: string; text?: string; action?: "breathing" }[] = [
  { label: "🌫️ 감정 표현이 어려워요", text: "지금 기분을 뭐라고 표현해야 할지 모르겠어요" },
  { label: "💬 그냥 들어주세요", text: "조언 말고 그냥 들어주세요" },
  { label: "🧭 조언이 필요해요", text: "제가 어떻게 하면 좋을지 조언해주세요" },
  { label: "🎯 작은 목표 정하기", text: "오늘 실천할 작은 목표 하나 정하고 싶어요" },
  { label: "📋 대화 요약해줘", text: "지금까지 한 얘기 요약해줘" },
  { label: "🌿 호흡 가이드 시작하기", action: "breathing" },
  { label: "🕊️ 오늘은 여기까지", text: "오늘은 여기까지 하고 싶어요" },
];

interface Message {
  id: number;
  sender: "ai" | "user";
  text: string;
  time: string;
  emotionTag?: string;
}

export default function CounselPage() {
  const navigate = useNavigate();

  // 카메라는 사용자가 모달에서 직접 켜기를 선택하기 전까지는 꺼진 상태로 시작함
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [inputText, setInputText] = useState("");

  // 초기 기분 입력 모달 상태 (mood: 기분 입력 단계, camera: 카메라 사용 여부 확인 단계)
  const [isInitialModalOpen, setIsInitialModalOpen] = useState(true);
  const [preCounselStep, setPreCounselStep] = useState<"mood" | "camera">("mood");
  const [initialMoodText, setInitialMoodText] = useState("");


  // 카메라 연결 실패 사유 (권한 거부 / 카메라 없음 / 다른 프로그램에서 사용 중 등) - 있으면 화면에 안내 문구로 표시
  const [cameraError, setCameraError] = useState<string | null>(null);
  // 연결 가능한 카메라 목록과 사용자가 선택한 카메라 (노트북 내장캠 + 외장 웹캠 등 여러 대인 경우 선택용)
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  // 내 얼굴 화면 숨김 여부 - 카메라 자체는 계속 켜둔 채로(분석/전송 계속) 화면에만 안 보이게 함
  const [isSelfViewHidden, setIsSelfViewHidden] = useState(false);

  // 상담 중 실시간으로 표시할 주요 감정 (카메라 주기 분석 결과)
  const [latestEmotion, setLatestEmotion] = useState<{ label: string; percent: number } | null>(null);
  // FastAPI 챗봇 서버 연결 상태 - Feely AI 상담사 옆 표시등에 사용 (녹색: 연결됨, 빨간색: 연결 안됨)
  const [isServerOnline, setIsServerOnline] = useState(true);
  // 호흡 가이드 모달 열림 여부 / 현재 몇 번째 단계인지 (BREATH_PHASES 인덱스)
  const [isBreathingGuideOpen, setIsBreathingGuideOpen] = useState(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // 마이크 음성인식(SpeechRecognition) 인스턴스 보관용
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isNormalExit = useRef(false);
  // 시작 이미지는 영상이 처음 준비됐을 때 한 번만 자동 캡처하기 위한 가드
  const hasCapturedStartRef = useRef(false);
  // 상담 시작 시점 캡처 이미지 - 지금은 백엔드가 안 받지만, 나중에 다시 지원할 때를 대비해 들고 있음
  const startImageRef = useRef<string | null>(null);
  // FastAPI 챗봇 서버에 상담 1회당 하나씩 발급하는 대화 식별자 (대화 히스토리 구분용)
  const chatSessionIdRef = useRef<string>(crypto.randomUUID());

  // 감정 카테고리 코드 -> 한글 라벨 (CounselEntity의 e01~e06 컬럼과 동일한 분류)
  const EMOTION_LABELS: Record<string, string> = {
    e01: "중립",
    e02: "기쁨",
    e03: "슬픔",
    e04: "분노",
    e05: "당황",
    e06: "불안",
  };

  // 1. 웹캠 미디어 스트림 제어
  // PC/노트북 내장캠, 외장 USB 웹캠, 모바일 전면카메라를 모두 고려해서
  // 우선 전면 카메라(facingMode: user)로 요청하고, 지원 안 하는 기기/카메라면 기본 옵션으로 재시도함
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const stopStream = (s: MediaStream | null) => {
      s?.getTracks().forEach((track) => track.stop());
    };

    // 브라우저가 돌려주는 에러 종류별로 사용자에게 원인을 알려주기 위한 메시지 변환
    const describeError = (err: unknown): string => {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          return "카메라 권한이 거부되었습니다. 브라우저/기기 설정에서 카메라 권한을 허용해주세요.";
        }
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          return "사용 가능한 카메라를 찾을 수 없습니다.";
        }
        if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          return "카메라가 다른 프로그램에서 사용 중입니다. 다른 앱(화상회의, 다른 브라우저 탭 등)을 종료한 후 다시 시도해주세요.";
        }
      }
      return "카메라를 연결할 수 없습니다.";
    };

    const startCamera = async () => {
      setCameraError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        // http(비보안 접속) 환경이거나 구형 브라우저인 경우 getUserMedia 자체가 없음
        setCameraError("이 브라우저/접속 환경에서는 카메라를 사용할 수 없습니다. (HTTPS 접속이 필요할 수 있습니다)");
        return;
      }

      try {
        if (selectedCameraId) {
          // 사용자가 드롭다운에서 직접 선택한 카메라로 연결
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCameraId } },
            audio: false,
          });
        } else {
          // 1차: 전면 카메라 우선 요청 (노트북/모바일 모두 얼굴을 비추는 카메라)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "user" } },
            audio: false,
          });
        }
      } catch {
        try {
          // 2차: 지정한 카메라/facingMode 제약을 지원 안 하는 경우 기본 옵션으로 재시도
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err) {
          if (cancelled) return;
          console.warn("웹캠 연결 실패:", err);
          setCameraError(describeError(err));
          stream = null;
          return;
        }
      }

      if (cancelled) {
        stopStream(stream);
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 카메라 권한을 허용한 뒤에야 장치 이름(label)까지 정상적으로 조회되므로 연결 성공 이후에 목록을 갱신함
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setCameraDevices(devices.filter((d) => d.kind === "videoinput"));
        }
      } catch {
        // 목록 조회 실패해도 영상 송출 자체엔 지장 없으니 무시함
      }
    };

    if (isCamOn) {
      startCamera();
    }

    return () => {
      cancelled = true;
      stopStream(stream);
    };
  }, [isCamOn, selectedCameraId]);

  // FastAPI 챗봇 서버 상태를 주기적으로 확인해서 표시등에 반영함 (상담 시작 전부터 계속 체크)
  useEffect(() => {
    let cancelled = false;

    const check = () => {
      checkServerHealth().then((online) => {
        if (!cancelled) setIsServerOnline(online);
      });
    };

    check();
    const intervalId = window.setInterval(check, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  // 호흡 가이드가 열려있는 동안 4초마다 다음 단계(들이쉬기/멈추기/내쉬기/멈추기)로 넘어감
  useEffect(() => {
    if (!isBreathingGuideOpen) return;

    const intervalId = window.setInterval(() => {
      setBreathPhaseIndex((prev) => (prev + 1) % BREATH_PHASES.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isBreathingGuideOpen]);

  // 2. 마이크 음성인식 제어 (브라우저 자체 Web Speech API 사용, 별도 백엔드 불필요)
  useEffect(() => {
    if (!isMicOn) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome에서 사용해주세요.");
      setIsMicOn(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    // 인식된 음성을 텍스트로 바꿔서 입력창에 실시간 반영
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    // 침묵 등으로 브라우저가 인식을 자체 종료하는 경우 버튼 상태도 같이 꺼줌
    recognition.onerror = () => {
      setIsMicOn(false);
    };
    recognition.onend = () => {
      setIsMicOn(false);
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isMicOn]);

  // 3. 프레임 캡처 함수 (상담 시작 시각 계산은 이제 FastAPI가 /counsel/start를 받는 시점에 직접 처리함)
  // 현재 비디오 프레임을 캡처해서 base64(JPEG) 문자열로 반환 (카메라가 꺼져있으면 null)
  const captureFrame = (): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };


  // 4. 카메라로 잡히는 화면을 주기적으로 감정분석(/emotion) 서버에 전송
  // 상담 모달이 열려있는 동안(카메라 사용 여부를 아직 안 정했을 때)은 보내지 않음
  useEffect(() => {
    if (!isCamOn || isInitialModalOpen) return;

    const intervalId = window.setInterval(() => {
      const frame = captureFrame();
      if (!frame) return;

      sendEmotionFrame({ sessionId: chatSessionIdRef.current, image: frame })
        .then((result) => {
          if (!result.scores) return;

          // 평균 계산은 FastAPI가 상담 종료 시점에 하므로, 여기서는 결과를 그대로 넘겨주기만 함
          sendEmotionSample(chatSessionIdRef.current, result.scores).catch((err) => {
            console.debug("감정 샘플 전달 실패:", err);
          });

          const topEntry = Object.entries(result.scores).sort((a, b) => b[1] - a[1])[0];
          if (topEntry) {
            const [code, value] = topEntry;
            setLatestEmotion({
              label: EMOTION_LABELS[code] ?? code,
              percent: Math.round(value * 100),
            });
          }
        })
        .catch((err) => {
          // 팀원 쪽 /emotion이 아직 스텁이거나 서버가 꺼져있으면 여기로 옴 - 상담 진행은 막지 않음
          console.debug("감정분석 서버 응답 없음:", err);
        });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isCamOn, isInitialModalOpen]);

  // 5. 이탈 감지 및 sendBeacon 전송
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isNormalExit.current) {
        e.preventDefault();
        e.returnValue = "상담 종료 버튼을 누르지 않을 경우 상담 요약이 제대로 이루어지지 않을 수 있습니다.";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isNormalExit.current) {
        // 상담 종료 버튼을 안 누르고 이탈한 경우 - 백엔드 저장은 하지 않고
        // FastAPI에 쌓인 세션 데이터(대화 이력, 감정 샘플)만 정리해서 메모리 누수를 막음
        const payload = { sessionId: chatSessionIdRef.current };
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon(COUNSEL_ABORT_BEACON_URL, blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 6. 초기 기분 제출 -> 카메라 사용 여부 확인 단계로 이동
  const handleMoodSubmit = () => {
    if (!initialMoodText.trim()) {
      alert("오늘의 기분이나 일상을 간단히 입력해주세요!");
      return;
    }

    setPreCounselStep("camera");
  };

  // 카메라 사용 여부 선택 후 상담 시작
  // (텍스트 0.6 : 표정 0.4 가중합으로 첫 감정을 추론하는 로직은
  //  FastAPI 쪽 상담 시작 전용 엔드포인트가 만들어지면 여기서 그 엔드포인트를 호출하도록 교체)
  const handleCameraChoice = (useCamera: boolean) => {
    setIsCamOn(useCamera);

    if (!useCamera) {
      // 카메라를 안 쓰면 시작 이미지를 캡처할 onLoadedData가 아예 안 불리므로 여기서 바로 상담 시작을 알림
      startCounselSession(chatSessionIdRef.current).catch((err) => {
        console.warn("상담 시작 기록 실패:", err);
      });
    }

    // 첫 대화로 등록
    handleSendMessage(initialMoodText);

    // 모달 닫기
    setIsInitialModalOpen(false);
  };

  // 7. 상담 종료 핸들러
  // FastAPI에서 요약/감정평균만 계산받고, 백엔드(/api/counsel) 저장은 로그인 세션 쿠키를 든 프론트가 직접 수행함
  // (지금 백엔드는 이미지를 안 받으므로 캡처한 종료 이미지는 아직 전송하지 않음)
  const handleFinishCounseling = async () => {
    if (!window.confirm("상담을 종료하시겠습니까?")) return;

    isNormalExit.current = true;

    try {
      const summary = await finishCounselSession(chatSessionIdRef.current, "COMPLETED");
      const result = await saveCounselRecord(summary);

      if (result.counselFlag) {
        alert("상담이 정상적으로 종료되었습니다.");
        navigate("/mypage");
      } else {
        // 이 API는 counselFlag:false 하나로 "세션 없음"과 "저장 중 예외"를 구분 없이 알려줘서
        // 여기서 원인을 단정할 수 없음 (실제로 DB 컬럼 문제로 실패해도 이 분기로 옴) ->
        // 섣불리 로그아웃시키지 않고 일반 실패 메시지만 보여줌
        alert("상담 데이터 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("상담 데이터 전송 실패:", error);
      alert("데이터 전송 중 오류가 발생했습니다.");
    }
  };

  // 8. 대화 목록 및 메시지 전송 로직
  // 하드코딩된 AI 첫 인사말 없이 빈 배열로 시작 -> 첫 메시지는 사용자가 입력한 초기 기분(질의응답)이 됨
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const timeString = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
      time: timeString,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");

    // FastAPI 챗봇 서버에 실제 메시지를 보내고 응답을 받아옴
    try {
      const result = await sendChatMessage({
        sessionId: chatSessionIdRef.current,
        message: textToSend,
      });

      const aiReply: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: result.reply,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error("AI 챗봇 응답 오류:", error);
      const errorReply: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: "죄송해요, 지금 응답을 받아오는 데 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 relative">

      {/* 초기 기분 입력 / 카메라 사용 확인 모달 팝업 */}
      {isInitialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {preCounselStep === "mood" ? (
              <>
                <div className="text-center space-y-2">
                  <span className="text-4xl">👋</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    오늘 하루는 어떠셨나요?
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    상담을 시작하기 전, 오늘 있었던 일이나 지금 느끼는 감정을 편하게 남겨주세요.
                  </p>
                </div>

                <textarea
                  rows={3}
                  value={initialMoodText}
                  onChange={(e) => setInitialMoodText(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter로 바로 제출, Shift+Enter는 줄바꿈으로 남겨둠
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleMoodSubmit();
                    }
                  }}
                  placeholder="예: 오늘 프로젝트 회의가 길어져서 조금 피곤해요..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6170] resize-none"
                />

                <button
                  type="button"
                  onClick={handleMoodSubmit}
                  className="w-full py-3 bg-[#1F6170] hover:bg-[#184d59] text-white font-medium rounded-xl transition-all shadow-md active:scale-98"
                >
                  다음
                </button>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <span className="text-4xl">📷</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    카메라를 사용하시겠어요?
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    표정을 함께 분석하면 더 정확한 상담이 가능해요. 원치 않으시면 대화만으로도 진행할 수 있어요.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleCameraChoice(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all"
                  >
                    사용 안 함
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCameraChoice(true)}
                    className="flex-1 py-3 bg-[#1F6170] hover:bg-[#184d59] text-white font-medium rounded-xl transition-all shadow-md active:scale-98"
                  >
                    사용하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 호흡 가이드 모달 - 4초 간격으로 들이쉬기/멈추기/내쉬기/멈추기를 반복 표시함 */}
      {isBreathingGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#1F6170]/10 dark:bg-cyan-400/10 flex items-center justify-center shrink-0">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1F6170] dark:bg-cyan-400 transition-transform duration-[4000ms] ease-in-out ${BREATH_PHASES[breathPhaseIndex].scale}`}
              />
            </div>

            <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 text-center">
              {BREATH_PHASES[breathPhaseIndex].label}
            </p>

            <button
              type="button"
              onClick={() => setIsBreathingGuideOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 1. 상단 상태 헤더 바 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 ml-5">
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isServerOnline ? "bg-emerald-400" : "bg-red-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isServerOnline ? "bg-emerald-500" : "bg-red-500"}`}
              title={isServerOnline ? "AI 서버 연결됨" : "AI 서버 연결 안 됨"}
            ></span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Feely 실시간 AI 심리상담실
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              사용자의 얼굴 표정과 대화를 종합 분석하여 맞춤형 상담을 진행합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleFinishCounseling}
            className="px-4 py-3 text-xs sm:text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0 mr-5"
          >
            상담 종료
          </button>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* 좌측: 웹캠 / 실시간 표정 분석 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                📷 실시간 얼굴 영상
              </span>
            </div>

            <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner">
              {cameraError ? (
                <div className="flex flex-col items-center text-gray-400 gap-2 px-4 text-center">
                  <span className="text-xs font-medium">{cameraError}</span>
                </div>
              ) : isCamOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                    onLoadedData={() => {
                      // 영상이 처음 준비됐을 때 한 번만 시작 이미지로 캡처해서 프론트에 보관하고,
                      // 그 시점을 상담 시작으로 FastAPI에 알림
                      if (!hasCapturedStartRef.current) {
                        const frame = captureFrame();
                        if (frame) {
                          hasCapturedStartRef.current = true;
                          startImageRef.current = frame;
                          startCounselSession(chatSessionIdRef.current).catch((err) => {
                            console.warn("상담 시작 기록 실패:", err);
                          });
                        }
                      }
                    }}
                  />

                  {!isInitialModalOpen && (
                    <>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {latestEmotion ? (
                          <>
                            주요 감정: <strong>{latestEmotion.label} ({latestEmotion.percent}%)</strong>
                          </>
                        ) : (
                          "감정 분석 대기 중..."
                        )}
                      </div>
                    </>
                  )}

                  {/* 내 얼굴 화면 숨기기 - 영상 자체는 계속 흘러서 캡처/분석은 그대로 진행됨 */}
                  <button
                    type="button"
                    onClick={() => setIsSelfViewHidden((prev) => !prev)}
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    title={isSelfViewHidden ? "내 화면 보기" : "내 화면 숨기기"}
                  >
                    {isSelfViewHidden ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>

                  {/* 숨김 상태일 때 영상 위를 덮는 오버레이 - video 자체는 안 건드려서 캡처는 그대로 진행됨 */}
                  {isSelfViewHidden && (
                    <div className="absolute inset-0 z-10 bg-gray-900/95 flex flex-col items-center justify-center gap-2 text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                      <span className="text-xs font-medium">내 화면을 숨겼어요 (분석은 계속 진행돼요)</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <span className="text-xs font-medium">카메라가 꺼져 있습니다</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={() => setIsCamOn(!isCamOn)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${isCamOn
                  ? "bg-[#0D9488] text-white hover:bg-[#184d59]"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                {isCamOn ? "📷 비디오 ON" : "📷 비디오 OFF"}
              </button>

              {/* 카메라가 여러 대 잡히는 경우(노트북 내장캠 + 외장 웹캠 등) 직접 선택할 수 있게 함 */}
              {isCamOn && cameraDevices.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  title="사용할 카메라 선택"
                >
                  <option value="">자동 선택</option>
                  {cameraDevices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `카메라 ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* 우측: AI 채팅 영역 */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col h-[75vh] min-h-[420px] lg:h-[680px] overflow-hidden">

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/70">
            <div className="flex items-center gap-3">
              <img
                src={FeelyLogo2}
                alt="Feely AI 상담사"
                className="h-8 w-auto max-w-[100px] object-contain shrink-0"
              />
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  Feely AI 상담사
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  공감형 대화 및 맞춤 심리 케어
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <span className="text-xs font-bold text-[#1F6170] dark:text-cyan-300">
                      Feely AI
                    </span>
                    {msg.emotionTag && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-[#1F6170] dark:text-cyan-300 border border-[#1F6170]/20 font-medium">
                        🔍 {msg.emotionTag}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                    ? "bg-[#0D9488] text-white rounded-tr-none font-medium"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-none"
                    }`}
                >
                  {msg.text}
                </div>

                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* 추천 답변 칩 */}
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-gray-400 shrink-0">빠른 답변:</span>
            {QUICK_REPLIES.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.action === "breathing") {
                    setBreathPhaseIndex(0);
                    setIsBreathingGuideOpen(true);
                  } else if (item.text) {
                    handleSendMessage(item.text);
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] dark:hover:bg-[#1F6170]/30 dark:hover:text-cyan-300 text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center ${isMicOn
                    ? "bg-red-500 border-red-500 text-white shadow-sm animate-pulse"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#1F6170] hover:border-[#0D9488] hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                title={isMicOn ? "마이크 끄기" : "마이크 켜기"}
              >
                {isMicOn ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 10v1a7 7 0 01-14 0v-1" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18v4M8 22h8" />
                    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isMicOn ? "음성을 듣고 있습니다..." : "마음속에 있는 생각이나 감정을 자유롭게 적어보세요..."}
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6170] focus:border-transparent transition-all"
              />

              <button
                type="submit"
                className="p-2.5 bg-[#0D9488] text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0 flex items-center justify-center"
                title="메시지 전송"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.77 59.77 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}