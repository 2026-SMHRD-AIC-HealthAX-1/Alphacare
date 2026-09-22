import { useState, useRef, useEffect } from "react";
import { sendCounselData, CounselDataPayload } from "../API/counsel";
import { sendChatMessage } from "../API/ai";
import { sendEmotionFrame } from "../API/emotion";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  sender: "ai" | "user";
  text: string;
  time: string;
  emotionTag?: string;
}


export default function CounselPage() {
  const navigate = useNavigate();

  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [inputText, setInputText] = useState("");

  // 초기 기분 입력 모달 상태 (mood: 기분 입력 단계, camera: 카메라 사용 여부 확인 단계)
  const [isInitialModalOpen, setIsInitialModalOpen] = useState(true);
  const [preCounselStep, setPreCounselStep] = useState<"mood" | "camera">("mood");
  const [initialMoodText, setInitialMoodText] = useState("");

  // 상담 시작 / 종료 시점에 웹캠에서 캡처한 이미지(base64)
  const [startImage, setStartImage] = useState<string | null>(null);

  // 상담 중 실시간으로 표시할 주요 감정 (카메라 주기 분석 결과)
  const [latestEmotion, setLatestEmotion] = useState<{ label: string; percent: number } | null>(null);
  // 상담 종료 시 평균을 내기 위해 카메라 분석 결과를 계속 쌓아두는 배열
  const emotionSamplesRef = useRef<Record<string, number>[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // 마이크 음성인식(SpeechRecognition) 인스턴스 보관용
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isNormalExit = useRef(false);
  // 시작 이미지는 영상이 처음 준비됐을 때 한 번만 자동 캡처하기 위한 가드
  const hasCapturedStartRef = useRef(false);
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
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isCamOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((userStream) => {
          stream = userStream;
          if (videoRef.current) {
            videoRef.current.srcObject = userStream;
          }
        })
        .catch((err) => {
          console.warn("웹캠을 연결할 수 없어 테스트 모드로 진행합니다:", err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCamOn]);

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

  // 3. 시간 변환 / 프레임 캡처 / 전송용 데이터 조립 함수들
  // Date.toISOString()은 항상 UTC 기준이라 그대로 쓰면 백엔드(LocalDateTime)에
  // 9시간 어긋난 시간이 저장됨 - 타임존을 Asia/Seoul로 명시해서 항상 한국시간으로 변환함
  const getKoreanDateTimeString = (date: Date): string => {
    const parts = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";

    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
  };

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

  // 지금까지 쌓인 카메라 분석 샘플들의 카테고리별 평균 점수 계산
  const getAverageEmotionScores = (): Record<string, number> => {
    const samples = emotionSamplesRef.current;
    if (samples.length === 0) return {};

    const sums: Record<string, number> = {};
    samples.forEach((sample) => {
      Object.entries(sample).forEach(([key, value]) => {
        sums[key] = (sums[key] ?? 0) + value;
      });
    });

    const averages: Record<string, number> = {};
    Object.entries(sums).forEach(([key, total]) => {
      averages[key] = total / samples.length;
    });
    return averages;
  };

  // 백엔드로 보낼 상담 데이터 조립
  // TODO: summary는 FastAPI 쪽 대화요약 엔드포인트 연동 후 실제 값으로 채워야 함
  // emotionScores는 카메라 주기 분석 결과의 평균값 (아직 팀원 쪽 /emotion이 스텁이라 항상 비어있을 수 있음)
  const buildCounselPayload = (
    status: "COMPLETED" | "ABORTED",
    endImage: string | null
  ): CounselDataPayload => {
    return {
      counselDate: getKoreanDateTimeString(new Date()),
      summary: "",
      emotionScores: getAverageEmotionScores(),
      startImagePath: startImage,
      endImagePath: endImage,
      status,
    };
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

          emotionSamplesRef.current.push(result.scores);

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
        const payload = buildCounselPayload("ABORTED", captureFrame());
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/counsel", blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startImage]);

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

    // 첫 대화로 등록
    handleSendMessage(initialMoodText);

    // 모달 닫기
    setIsInitialModalOpen(false);
  };

  // 7. 상담 종료 핸들러
  const handleFinishCounseling = async () => {
    if (!window.confirm("상담을 종료하시겠습니까?")) return;

    isNormalExit.current = true;

    const payload = buildCounselPayload("COMPLETED", captureFrame());

    try {
      const result = 
        await sendCounselData(payload);

      if (result.counselFlag) { 
        alert("상담이 정상적으로 종료되었습니다.");
        navigate("/mypage");
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

      {/* 1. 상단 상태 헤더 바 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Feely 실시간 AI 심리상담실
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1F6170]/10 text-[#1F6170] dark:bg-[#1F6170]/20 dark:text-cyan-300">
                {isInitialModalOpen ? "대기 중" : "카메라 분석 진행 중"}
              </span>
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
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors cursor-pointer"
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
              {isCamOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                    onLoadedData={() => {
                      // 영상이 처음 준비됐을 때 한 번만 시작 이미지로 캡처
                      if (!hasCapturedStartRef.current) {
                        const frame = captureFrame();
                        if (frame) {
                          setStartImage(frame);
                          hasCapturedStartRef.current = true;
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
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <span className="text-xs font-medium">카메라가 꺼져 있습니다</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsCamOn(!isCamOn)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${isCamOn
                    ? "bg-[#1F6170] text-white hover:bg-[#184d59]"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                {isCamOn ? "📷 비디오 ON" : "📷 비디오 OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* 우측: AI 채팅 영역 */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col h-[680px] overflow-hidden">

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1F6170] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                Feely
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  Feely AI 상담사
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
                      ? "bg-[#1F6170] text-white rounded-tr-none font-medium"
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
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors"
            >
              🌿 호흡 가이드 시작하기
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors"
            >
              📝 오늘 고민 구체적으로 쓰기
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors"
            >
              ☕ 잠깐 휴식하기
            </button>
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
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#1F6170] hover:border-[#1F6170] hover:bg-gray-50 dark:hover:bg-gray-700"
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
                className="p-2.5 bg-[#1F6170] text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0 flex items-center justify-center"
                title="메시지 전송"
              >
                <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}