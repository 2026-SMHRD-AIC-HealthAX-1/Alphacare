import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

import { getCounselData, CounselRecord } from "../API/counsel";
import { getRecommendedMusic, MusicRecommendation } from "../API/music";
import {
  EMOTION_LABELS,
  getDominantEmotion,
  getDominantEmotionIndex,
  formatEmotionPercent,
} from "../utils/emotion";

import test1 from "../assets/test5.mp4";
import face from "../assets/mainface.png";
import chat from "../assets/chat.png";
import EmotionCalender from "../assets/EmotionCalender.png";
import Report from "../assets/Report.png";

/* =========================================================
   날짜 함수
========================================================= */

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

const splitDttm = (dttm: string) => {
  const [datePart, timePart] = dttm.split(" ");

  return {
    datePart,
    timePart: timePart ? timePart.slice(0, 5) : "",
  };
};

const parseDttm = (dttm: string) => {
  const [datePart, timePart] = dttm.split(" ");

  return new Date(`${datePart}T${timePart ?? "00:00:00"}`);
};

/* =========================================================
   주간 날짜
========================================================= */

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);

  return d;
};

const getWeekDates = (date: Date) => {
  const monday = getMonday(date);

  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(monday);

    d.setDate(d.getDate() + index);

    return d;
  });
};

const DAY_LABELS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];

/* =========================================================
   MainPage
========================================================= */

export default function MainPage() {
  const navigate = useNavigate();
  /* =======================================================
     로그인
  ======================================================= */

  const [isLoggedIn] = useState<boolean>(
    () => Cookies.get("isLoggedIn") === "true"
  );

  /* =======================================================
     상담 데이터
  ======================================================= */

  const [counselLogs, setCounselLogs] = useState<
    CounselRecord[]
  >([]);

  const [counselLoading, setCounselLoading] =
    useState(false);

  const [counselError, setCounselError] =
    useState(false);

  /* =======================================================
     캘린더
  ======================================================= */

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(() => new Date());

  const [calendarViewDate, setCalendarViewDate] =
    useState<Date>(() => new Date());

  const [isWeeklyCalendar, setIsWeeklyCalendar] =
    useState(true);

  /* =======================================================
     기존 메인 슬라이드
  ======================================================= */

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const baseSlides = [
    {
      image: face,
      alt: "Face",
      imageOffset: "-230px",
      label: "감정 인식",
      title: "표정을 읽고, 마음을 이해해요.",
      descriptionLead: "웹캠으로 사용자의 표정을 인식해요.",
      description: "AI가 당신의 감정 변화를 함께 살펴봅니다.",
    },
    {
      image: chat,
      alt: "Counsel",
      imageOffset: "-230px",
      label: "AI 상담",
      title: "언제든, 편하게 이야기하세요.",
      descriptionLead: "언제든 편하게 마음속 이야기를 꺼내보세요.",
      description: "Feely AI 상담사가 당신의 마음을 듣고 함께 정리해 드려요.",
    },
    {
      image: EmotionCalender,
      alt: "Emotion Calendar",
      imageOffset: "-327px",
      label: "상담 기록",
      title: "오늘의 마음을 한눈에 정리해요.",
      descriptionLead: "상담이 끝난 뒤 오늘의 이야기를 요약해 드려요.",
      description: "상담 내용을 요약하고, 감정의 변화를 기록으로 남겨요.",
    },
    {
      image: Report,
      alt: "Weekly Emotion Report",
      imageOffset: "-348px",
      label: "주간 리포트",
      title: "한 주의 감정 흐름을 차트로 살펴봐요.",
      descriptionLead: "일주일 동안의 상담 기록을 차트로 확인하세요.",
      description: "상담 요약을 바탕으로 여섯 가지 감정 흐름을 차트로 보여드려요.",
    },
  ];

  /* =======================================================
     상담 데이터 불러오기
  ======================================================= */

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadCounselData = async () => {
      try {
        setCounselLoading(true);
        setCounselError(false);

        const data = await getCounselData();

        setCounselLogs(data);
      } catch (error) {
        console.error(
          "상담 기록을 불러오지 못했습니다:",
          error
        );

        setCounselError(true);
      } finally {
        setCounselLoading(false);
      }
    };

    loadCounselData();
  }, [isLoggedIn]);

  /* =======================================================
     비디오
  ======================================================= */

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, []);

  /* =======================================================
     월간 캘린더
  ======================================================= */

  const monthCells = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDay = new Date(year, month, 1);

    const startOffset =
      (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const daysInPreviousMonth = new Date(
      year,
      month,
      0
    ).getDate();

    const cells: {
      date: Date;
      dateStr: string;
      inCurrentMonth: boolean;
    }[] = [];

    for (
      let index = startOffset - 1;
      index >= 0;
      index--
    ) {
      const date = new Date(
        year,
        month - 1,
        daysInPreviousMonth - index
      );

      cells.push({
        date,
        dateStr: toDateKey(date),
        inCurrentMonth: false,
      });
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      const date = new Date(year, month, day);

      cells.push({
        date,
        dateStr: toDateKey(date),
        inCurrentMonth: true,
      });
    }

    const remainder = cells.length % 7;

    if (remainder !== 0) {
      const need = 7 - remainder;

      for (let day = 1; day <= need; day++) {
        const date = new Date(
          year,
          month + 1,
          day
        );

        cells.push({
          date,
          dateStr: toDateKey(date),
          inCurrentMonth: false,
        });
      }
    }

    return cells;
  }, [calendarViewDate]);

  /* =======================================================
     날짜별 감정
  ======================================================= */

  const emotionByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        emoji: string;
        score: number;
      }
    >();

    counselLogs.forEach((log) => {
      const { datePart } =
        splitDttm(log.counselDttm);

      const dominant =
        getDominantEmotion(log);

      const score = Number(
        log[dominant.key]
      );

      const existing = map.get(datePart);

      if (!existing || score > existing.score) {
        map.set(datePart, {
          emoji: dominant.emoji,
          score,
        });
      }
    });

    return map;
  }, [counselLogs]);

  /* =======================================================
     날짜 선택
  ======================================================= */

  const handleSelectDate = (date: Date) => {
    setSelectedDate(new Date(date));
    setIsWeeklyCalendar(true);
  };

  /* =======================================================
     월간으로 다시 펼치기
  ======================================================= */

  const handleExpandCalendar = () => {
    if (selectedDate) {
      setCalendarViewDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    }

    setIsWeeklyCalendar(false);
  };

  /* =======================================================
     이전 달
  ======================================================= */

  const goToPreviousMonth = () => {
    setCalendarViewDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1
        )
    );
  };

  /* =======================================================
     다음 달
  ======================================================= */

  const goToNextMonth = () => {
    setCalendarViewDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1
        )
    );
  };

  /* =======================================================
     선택한 날짜가 포함된 주간 캘린더
  ======================================================= */

  const weeklyDates = useMemo(() => {
    if (!selectedDate) return [];

    return getWeekDates(selectedDate);
  }, [selectedDate]);

  /* =======================================================
     선택 날짜 상담 기록
  ======================================================= */

  const selectedDateLogs = useMemo(() => {
    if (!selectedDate) return [];

    const selectedKey =
      toDateKey(selectedDate);

    return counselLogs.filter(
      (log) =>
        splitDttm(log.counselDttm)
          .datePart === selectedKey
    );
  }, [
    counselLogs,
    selectedDate,
  ]);

  const isSelectedToday =
    selectedDate !== null &&
    toDateKey(selectedDate) ===
      toDateKey(new Date());

  /* =======================================================
     차트 날짜
     
     ★ 주간 캘린더와 동일한 7일
  ======================================================= */

  const chartDates = useMemo(() => {
    return weeklyDates;
  }, [weeklyDates]);

  const chartDateKeys = useMemo(
    () =>
      chartDates.map((date) =>
        toDateKey(date)
      ),
    [chartDates]
  );

  /* =======================================================
     주간 차트 상담 데이터
  ======================================================= */

  const chartLogs = useMemo(() => {
    if (chartDateKeys.length === 0) {
      return [];
    }

    return counselLogs.filter((log) =>
      chartDateKeys.includes(
        splitDttm(log.counselDttm)
          .datePart
      )
    );
  }, [
    counselLogs,
    chartDateKeys,
  ]);

  /* =======================================================
     차트 포인트
  ======================================================= */

  const chartTimePoints = useMemo(() => {
    if (chartDates.length !== 7) {
      return [];
    }

    const startDate =
      new Date(chartDates[0]);

    startDate.setHours(0, 0, 0, 0);

    const endDate =
      new Date(chartDates[6]);

    endDate.setDate(
      endDate.getDate() + 1
    );

    endDate.setHours(0, 0, 0, 0);

    const totalMs =
      endDate.getTime() -
      startDate.getTime();

    return chartLogs
      .map((log) => {
        const dominantIndex =
          getDominantEmotionIndex([log]);

        if (dominantIndex === null) {
          return null;
        }

        const time =
          parseDttm(log.counselDttm);

        const x =
          ((time.getTime() -
            startDate.getTime()) /
            totalMs) *
          100;

        const safeX = Math.min(
          100,
          Math.max(0, x)
        );

        const y =
          (dominantIndex /
            (EMOTION_LABELS.length - 1)) *
          100;

        const hh = String(
          time.getHours()
        ).padStart(2, "0");

        const mm = String(
          time.getMinutes()
        ).padStart(2, "0");

        return {
          x: safeX,
          y,
          tooltip: `${
            time.getMonth() + 1
          }/${time.getDate()} ${
            DAY_LABELS[time.getDay()]
          } ${hh}:${mm} · ${
            EMOTION_LABELS[
              dominantIndex
            ].label
          }`,
        };
      })
      .filter(
        (
          point
        ): point is {
          x: number;
          y: number;
          tooltip: string;
        } => point !== null
      )
      .sort(
        (a, b) => a.x - b.x
      );
  }, [
    chartDates,
    chartLogs,
  ]);

  const [
    hoveredChartIndex,
    setHoveredChartIndex,
  ] = useState<number | null>(
    null
  );

  const hoveredChartPoint =
    hoveredChartIndex !== null
      ? chartTimePoints[
          hoveredChartIndex
        ]
      : null;

  /* =======================================================
     주간 감정 요약 / 추천 음악
  ======================================================= */

  const weeklyDominantIndex = useMemo(() => {
    return getDominantEmotionIndex(chartLogs);
  }, [chartLogs]);

  const weeklyDominantLabel =
    weeklyDominantIndex === null
      ? null
      : EMOTION_LABELS[weeklyDominantIndex].label;

  const [weeklyMusic, setWeeklyMusic] =
    useState<MusicRecommendation[]>([]);

  const [weeklyMusicLoading, setWeeklyMusicLoading] =
    useState(false);

  const [weeklyMusicError, setWeeklyMusicError] =
    useState(false);

  useEffect(() => {
    if (!selectedDate || weeklyDominantLabel === null) {
      setWeeklyMusic([]);
      setWeeklyMusicError(false);
      setWeeklyMusicLoading(false);
      return;
    }

    const loadWeeklyMusic = async () => {
      try {
        setWeeklyMusicLoading(true);
        setWeeklyMusicError(false);

        const data =
          await getRecommendedMusic(
            weeklyDominantLabel
          );

        setWeeklyMusic(data);
      } catch (error) {
        console.error(
          "추천 음악을 불러오지 못했습니다:",
          error
        );

        setWeeklyMusicError(true);
      } finally {
        setWeeklyMusicLoading(false);
      }
    };

    loadWeeklyMusic();
  }, [weeklyDominantLabel]);

  /* =======================================================
     기존 슬라이드
  ======================================================= */

  const nextSlide = () => {
    if (isAnimating) return;

    setSlideDirection(1);
    setIsAnimating(true);
  };

  const prevSlide = () => {
    if (isAnimating) return;

    setSlideDirection(-1);
    setIsAnimating(true);
  };

  const handleTransitionEnd = () => {
    if (!isAnimating) return;

    if (slideDirection === 1) {
      setCurrentSlide((previous) => {
        return (
          (previous + 1) %
          baseSlides.length
        );
      });
    } else {
      setCurrentSlide((previous) => {
        return (
          (previous -
            1 +
            baseSlides.length) %
          baseSlides.length
        );
      });
    }

    setIsAnimating(false);
  };

  const targetSlide =
    slideDirection === 1
      ? (currentSlide + 1) %
        baseSlides.length
      : (currentSlide -
          1 +
          baseSlides.length) %
        baseSlides.length;

  /* =======================================================
     드래그
  ======================================================= */

  const handleTouchStart = (
    clientX: number
  ) => {
    if (isAnimating) return;

    setIsDragging(true);
    setStartX(clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (
    clientX: number
  ) => {
    if (!isDragging || isAnimating)
      return;

    setDragOffset(
      clientX - startX
    );
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (dragOffset < -50) {
      setDragOffset(0);
      nextSlide();
    } else if (dragOffset > 50) {
      setDragOffset(0);
      prevSlide();
    } else {
      setDragOffset(0);
    }
  };

  /* =======================================================
     로그인 상태
     
     상담 대시보드
  ======================================================= */

  if (isLoggedIn) {
    return (
      <main
        className="dashboard-main"
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding:
            "40px 30px 80px",
          boxSizing:
            "border-box",
        }}
      >
        <div
          className="dashboard-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 0.95fr) minmax(0, 1.35fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* =================================================
              왼쪽 영역
          ================================================= */}

          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection:
                "column",
              gap: "20px",
            }}
          >
            {/* =================================================
                캘린더
            ================================================= */}

            <section
              style={{
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "20px",
                padding:
                  "24px",
                backgroundColor:
                  "#ffffff",
                boxSizing:
                  "border-box",
                overflow:
                  "hidden",
              }}
            >
              {/* =================================================
                  월간 캘린더
              ================================================= */}

              {!isWeeklyCalendar ? (
                <>
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "12px",
                      marginBottom:
                        "24px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        goToPreviousMonth
                      }
                      style={{
                        width:
                          "32px",
                        height:
                          "32px",
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          "#6b7280",
                        cursor:
                          "pointer",
                        fontSize:
                          "22px",
                      }}
                    >
                      ‹
                    </button>

                    <span
                      style={{
                        fontSize:
                          "20px",
                        fontWeight:
                          700,
                        color:
                          "#111827",
                      }}
                    >
                      {
                        calendarViewDate.getFullYear()
                      }
                      년{" "}
                      {
                        calendarViewDate.getMonth() +
                          1
                      }
                      월
                    </span>

                    <button
                      type="button"
                      onClick={
                        goToNextMonth
                      }
                      style={{
                        width:
                          "32px",
                        height:
                          "32px",
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          "#6b7280",
                        cursor:
                          "pointer",
                        fontSize:
                          "22px",
                      }}
                    >
                      ›
                    </button>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(7, 1fr)",
                      textAlign:
                        "center",
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                      color:
                        "#9ca3af",
                      marginBottom:
                        "8px",
                    }}
                  >
                    {[
                      "월",
                      "화",
                      "수",
                      "목",
                      "금",
                      "토",
                      "일",
                    ].map(
                      (day) => (
                        <div
                          key={
                            day
                          }
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(7, 1fr)",
                      gap: "6px",
                    }}
                  >
                    {monthCells.map(
                      (cell) => {
                        const isSelected =
                          selectedDate &&
                          toDateKey(selectedDate) ===
                            cell.dateStr;

                        const emotion =
                          emotionByDate.get(
                            cell.dateStr
                          );

                        return (
                          <button
                            key={
                              cell.dateStr
                            }
                            type="button"
                            onClick={() =>
                              handleSelectDate(
                                cell.date
                              )
                            }
                            style={{
                              aspectRatio:
                                "1 / 1",
                              width:
                                "100%",
                              border:
                                isSelected
                                  ? "2px solid #0D9488"
                                  : "2px solid transparent",
                              borderRadius:
                                "10px",
                              background:
                                "transparent",
                              color:
                                isSelected
                                  ? "#0D9488"
                                  : cell.inCurrentMonth
                                  ? "#111827"
                                  : "#d1d5db",
                              cursor:
                                "pointer",
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              gap: "3px",
                              fontSize:
                                "14px",
                            }}
                          >
                            <span>
                              {
                                cell.date.getDate()
                              }
                            </span>

                            {emotion && (
                              <span
                                style={{
                                  fontSize:
                                    "15px",
                                }}
                              >
                                {
                                  emotion.emoji
                                }
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </>
              ) : (
                /* =================================================
                   주간 캘린더
                ================================================= */

                <>
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      marginBottom:
                        "20px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "16px",
                        fontWeight:
                          700,
                        color:
                          "#111827",
                      }}
                    >
                      {weeklyDates[0]
                        ? `${
                            weeklyDates[0].getMonth() +
                            1
                          }월 ${
                            weeklyDates[0].getDate()
                          }일`
                        : ""}
                      {" - "}
                      {weeklyDates[6]
                        ? `${
                            weeklyDates[6].getMonth() +
                            1
                          }월 ${
                            weeklyDates[6].getDate()
                          }일`
                        : ""}
                    </span>

                    {/* ★ 월간으로 다시 늘리는 버튼 */}

                    <button
                      type="button"
                      onClick={
                        handleExpandCalendar
                      }
                      style={{
                        border:
                          "1px solid #d1d5db",
                        background:
                          "#ffffff",
                        color:
                          "#4b5563",
                        borderRadius:
                          "8px",
                        padding:
                          "7px 12px",
                        fontSize:
                          "12px",
                        fontWeight:
                          600,
                        cursor:
                          "pointer",
                      }}
                    >
                      월간 보기
                    </button>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(7, 1fr)",
                      gap: "6px",
                    }}
                  >
                    {weeklyDates.map(
                      (date) => {
                        const dateKey =
                          toDateKey(
                            date
                          );

                        const isSelected =
                          selectedDate &&
                          toDateKey(
                            selectedDate
                          ) ===
                            dateKey;

                        const emotion =
                          emotionByDate.get(
                            dateKey
                          );

                        return (
                          <button
                            key={
                              dateKey
                            }
                            type="button"
                            onClick={() =>
                              handleSelectDate(
                                date
                              )
                            }
                            style={{
                              height:
                                "70px",
                              border:
                                isSelected
                                  ? "2px solid #0D9488"
                                  : "2px solid transparent",
                              borderRadius:
                                "10px",
                              background:
                                "#f8fafc",
                              color:
                                isSelected
                                  ? "#0D9488"
                                  : "#111827",
                              cursor:
                                "pointer",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              position:
                                "relative",
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  "12px",
                                position:
                                  "absolute",
                                top: "8px",
                                opacity:
                                  isSelected
                                    ? 0.85
                                    : 0.55,
                              }}
                            >
                              {
                                DAY_LABELS[
                                  date.getDay()
                                ]
                              }
                            </span>

                            <span
                              style={{
                                fontSize:
                                  "16px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {
                                date.getDate()
                              }
                            </span>

                            {emotion && (
                              <span
                              style={{
                                fontSize:
                                  "15px",
                                position:
                                  "absolute",
                                bottom: "7px",
                                lineHeight:
                                  1,
                                }}
                              >
                                {
                                  emotion.emoji
                                }
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </section>

            {/* =================================================
                상담 요약
            ================================================= */}

            {selectedDate && (
              <section
                style={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "20px",
                  padding:
                    "24px",
                  backgroundColor:
                    "#ffffff",
                  boxSizing:
                    "border-box",
                }}
              >
                <h2
                  style={{
                    margin:
                      "0 0 20px",
                    fontSize:
                      "18px",
                    fontWeight:
                      700,
                    color:
                      "#111827",
                  }}
                >
                  {selectedDate.getFullYear()}
                  .
                  {String(
                    selectedDate.getMonth() +
                      1
                  ).padStart(
                    2,
                    "0"
                  )}
                  .
                  {String(
                    selectedDate.getDate()
                  ).padStart(
                    2,
                    "0"
                  )}
                  {" 상담 요약"}
                </h2>

                {counselLoading ? (
                  <div
                    style={{
                      minHeight:
                        "200px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color:
                        "#9ca3af",
                    }}
                  >
                    상담 기록을 불러오는 중입니다...
                  </div>
                ) : counselError ? (
                  <div
                    style={{
                      minHeight:
                        "200px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color:
                        "#9ca3af",
                    }}
                  >
                    상담 기록을 불러오지 못했습니다.
                  </div>
                ) : selectedDateLogs.length ===
                  0 ? (
                  <div
                    onClick={() => {
                      if (isSelectedToday) {
                        navigate("/Counsel");
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        isSelectedToday &&
                        (event.key === "Enter" ||
                          event.key === " ")
                      ) {
                        event.preventDefault();
                        navigate("/Counsel");
                      }
                    }}
                    role={
                      isSelectedToday
                        ? "button"
                        : undefined
                    }
                    tabIndex={
                      isSelectedToday ? 0 : undefined
                    }
                    style={{
                      minHeight:
                        "200px",
                      display:
                        "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        color:
                          "#9ca3af",
                        border:
                          "1px dashed #d1d5db",
                        borderRadius:
                          "12px",
                      boxSizing:
                        "border-box",
                      cursor:
                        isSelectedToday
                          ? "pointer"
                          : "default",
                    }}
                  >
                    {isSelectedToday ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong
                          style={{
                            color: "#4b5563",
                          }}
                        >
                          오늘의 상담 기록이 아직 없어요.
                        </strong>
                        <span>
                          필요할 때 언제든 상담을 시작할 수 있어요.
                        </span>
                      </div>
                    ) : (
                      "선택한 날짜에 상담 기록이 없습니다."
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "30px",
                    }}
                  >
                    {selectedDateLogs.map(
                      (
                        log,
                        index
                      ) => {
                        const dominant =
                          getDominantEmotion(
                            log
                          );

                        const {
                          timePart,
                        } =
                          splitDttm(
                            log.counselDttm
                          );

                        return (
                          <div
                            key={
                              log.counselNo
                            }
                            style={{
                              paddingTop:
                                index >
                                0
                                  ? "20px"
                                  : 0,
                              borderTop:
                                index >
                                0
                                  ? "1px solid #e5e7eb"
                                  : "none",
                            }}
                          >
                            {/* 상담 시간 / 감정 */}

                            <div
                              className="daily-photo-grid"
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "space-between",
                                marginBottom:
                                  "16px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize:
                                    "14px",
                                  fontWeight:
                                    700,
                                  color:
                                    "#1F6170",
                                }}
                              >
                                {
                                  timePart
                                }
                              </span>

                              <span
                                className="relative group cursor-default"
                                style={{
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    700,
                                  color:
                                    "#0D9488",
                                  padding:
                                    "6px 10px",
                                  border:
                                    "1px solid #0D9488",
                                  borderRadius:
                                    "999px",
                                  backgroundColor:
                                    "transparent",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "15px",
                                  }}
                                >
                                  {dominant.emoji}
                                </span>{" "}
                                {
                                  dominant.label
                                }{" "}
                                (
                                {formatEmotionPercent(
                                  log[
                                    dominant
                                      .key
                                  ]
                                )}
                                %)

                                {/* 호버 시 감정 점수 6개를 높은 순으로 보여주는 툴팁 (EmotionCalender.tsx와 동일한 패턴)
                                    바깥쪽 래퍼는 margin 대신 padding-top(pt-2)으로 간격을 줘서, 배지와 툴팁 사이
                                    빈 공간도 group의 hover 영역에 포함시킴 - 그래야 마우스가 배지에서 툴팁으로
                                    이동하는 중간에 hover가 끊겨서 사라지지 않고, 툴팁 위로 마우스를 올려도 유지됨 */}
                                <div className="absolute right-0 top-full z-20 hidden w-40 pt-2 group-hover:block">
                                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-2">
                                    <ul className="space-y-1">
                                      {[...EMOTION_LABELS]
                                        .sort((a, b) => Number(log[b.key]) - Number(log[a.key]))
                                        .map((item) => (
                                          <li
                                            key={item.key}
                                            className="flex items-center justify-between gap-2 text-xs font-normal text-gray-700 dark:text-gray-200"
                                          >
                                            <span>{item.emoji} {item.label}</span>
                                            <span className="font-semibold">{formatEmotionPercent(log[item.key])}%</span>
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                </div>
                              </span>
                            </div>

                            {/* =================================================
                                ★★★ 사진 영역 ★★★
                                
                                사진이 있어도 200x200
                                사진이 없어도 200x200 영역 유지
                            ================================================= */}

                            <div
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                                gap:
                                  "20px",
                                marginBottom:
                                  "20px",
                              }}
                            >
                              {/* 시작 사진 영역 */}

                              <div
                                style={{
                                  width:
                                    "100%",
                                  aspectRatio:
                                    "1 / 1",
                                  border:
                                    "1px solid #d1d5db",
                                  borderRadius:
                                    "10px",
                                  backgroundColor:
                                    "#f9fafb",
                                  overflow:
                                    "hidden",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                }}
                              >
                                {log.startImage ? (
                                  <img
                                    src={
                                      `data:image/jpeg;base64,${log.startImage}`
                                    }
                                    alt="상담 시작 시점 표정"
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      objectFit:
                                        "cover",
                                      display:
                                        "block",
                                    }}
                                    onError={(
                                      event
                                    ) => {
                                      const target =
                                        event.currentTarget;

                                      target.style.display =
                                        "none";

                                      const parent =
                                        target.parentElement;

                                      if (
                                        parent
                                      ) {
                                        parent.setAttribute(
                                          "data-image-error",
                                          "true"
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      fontSize:
                                        "13px",
                                      color:
                                        "#9ca3af",
                                      fontWeight:
                                        500,
                                    }}
                                  >
                                    사진 영역
                                  </span>
                                )}
                              </div>

                              {/* 종료 사진 영역 */}

                              <div
                                style={{
                                  width:
                                    "100%",
                                  aspectRatio:
                                    "1 / 1",
                                  border:
                                    "1px solid #d1d5db",
                                  borderRadius:
                                    "10px",
                                  backgroundColor:
                                    "#f9fafb",
                                  overflow:
                                    "hidden",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                }}
                              >
                                {log.endImage ? (
                                  <img
                                    src={
                                      `data:image/jpeg;base64,${log.endImage}`
                                    }
                                    alt="상담 종료 시점 표정"
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      objectFit:
                                        "cover",
                                      display:
                                        "block",
                                    }}
                                    onError={(
                                      event
                                    ) => {
                                      const target =
                                        event.currentTarget;

                                      target.style.display =
                                        "none";

                                      const parent =
                                        target.parentElement;

                                      if (
                                        parent
                                      ) {
                                        parent.setAttribute(
                                          "data-image-error",
                                          "true"
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      fontSize:
                                        "13px",
                                      color:
                                        "#9ca3af",
                                      fontWeight:
                                        500,
                                    }}
                                  >
                                    사진 영역
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* =================================================
                                ★ 상담 요약
                                
                                사진 아래
                            ================================================= */}

                            <div>
                              <p
                                style={{
                                  margin:
                                    "0 0 8px",
                                  fontSize:
                                    "14px",
                                  fontWeight:
                                    700,
                                  color:
                                    "#111827",
                                }}
                              >
                                상담 요약
                              </p>

                              <p
                                style={{
                                  margin: 0,
                                  fontSize:
                                    "13px",
                                  lineHeight:
                                    1.7,
                                  color:
                                    "#6b7280",
                                  whiteSpace:
                                    "pre-line",
                                }}
                              >
                                {
                                  log.counselSum
                                }
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* =================================================
              오른쪽 차트
          ================================================= */}

          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <section
            style={{
              minWidth: 0,
              border:
                "1px solid #e5e7eb",
              borderRadius:
                "20px",
              padding:
                "24px",
              backgroundColor:
                "#ffffff",
              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                marginBottom:
                  "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "20px",
                  fontWeight:
                    700,
                  color:
                    "#111827",
                }}
              >
                일주일 동안의 감정 변화
              </h2>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  fontSize:
                    "13px",
                  color:
                    "#9ca3af",
                }}
              >
                {selectedDate &&
                weeklyDates.length ===
                  7
                  ? `${
                      weeklyDates[0].getMonth() +
                      1
                    }월 ${
                      weeklyDates[0].getDate()
                    }일 ~ ${
                      weeklyDates[6].getMonth() +
                      1
                    }월 ${
                      weeklyDates[6].getDate()
                    }일`
                  : "날짜를 선택하면 해당 주의 통계가 표시됩니다."}
              </p>
            </div>

            {!selectedDate ? (
              <div
                style={{
                  height:
                    "430px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color:
                    "#9ca3af",
                  fontSize:
                    "14px",
                  backgroundColor:
                    "#f9fafb",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "16px",
                }}
              >
                캘린더에서 날짜를 선택해주세요.
              </div>
            ) : counselLoading ? (
              <div
                style={{
                  height:
                    "430px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color:
                    "#9ca3af",
                }}
              >
                상담 기록을 불러오는 중입니다...
              </div>
            ) : counselError ? (
              <div
                style={{
                  height:
                    "430px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color:
                    "#9ca3af",
                }}
              >
                상담 기록을 불러오지 못했습니다.
              </div>
            ) : (
              <div
                style={{
                  backgroundColor:
                    "#f9fafb",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "16px",
                  padding:
                    "24px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    height:
                      "400px",
                    alignItems:
                      "flex-start",
                  }}
                >
                  {/* Y축 */}

                  <div
                    style={{
                      width:
                        "75px",
                      height:
                        "360px",
                      flexShrink: 0,
                      position:
                        "relative",
                      paddingRight:
                        "12px",
                      borderRight:
                        "1px solid #e5e7eb",
                    }}
                  >
                    {EMOTION_LABELS.map(
                      (emotion, index) => (
                        <span
                          key={
                            emotion.label
                          }
                          style={{
                            position:
                              "absolute",
                            left: 0,
                            top: `${
                              (index /
                                (EMOTION_LABELS.length -
                                  1)) *
                              100
                            }%`,
                            transform:
                              "translateY(-50%)",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "5px",
                            fontSize:
                              "12px",
                            color:
                              "#6b7280",
                            fontWeight:
                              600,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "15px",
                            }}
                          >
                            {
                              emotion.emoji
                            }
                          </span>

                          <span
                            style={{
                              fontSize: "14px",
                            }}
                          >
                            {
                              emotion.label
                            }
                          </span>
                        </span>
                      )
                    )}
                  </div>

                  {/* 그래프 */}

                  <div
                    style={{
                      position:
                        "relative",
                      flex: 1,
                      height:
                        "360px",
                      minWidth: 0,
                      marginLeft:
                        "16px",
                    }}
                  >
                    {/* 기준선 */}

                    {EMOTION_LABELS.map(
                      (_, index) => (
                        <div
                          key={
                            index
                          }
                          style={{
                            position:
                              "absolute",
                            left: 0,
                            right: 0,
                            top: `${
                              (index /
                                (EMOTION_LABELS.length -
                                  1)) *
                              100
                            }%`,
                            borderTop:
                              "1px dashed #e5e7eb",
                          }}
                        />
                      )
                    )}

                    {/* 날짜 구분선 */}

                    {chartDates
                      .slice(1)
                      .map(
                        (_, index) => (
                          <div
                            key={
                              `divider-${index}`
                            }
                            style={{
                              position:
                                "absolute",
                              top: 0,
                              bottom: 0,
                              left: `${
                                ((index +
                                  1) /
                                  7) *
                                100
                              }%`,
                              width:
                                "1px",
                              backgroundColor:
                                "#f0f0f0",
                            }}
                          />
                        )
                      )}

                    {/* 그래프 선 */}

                    <svg
                      style={{
                        position:
                          "absolute",
                        inset: 0,
                        width:
                          "100%",
                        height:
                          "100%",
                        overflow:
                          "visible",
                      }}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="dashboardEmotionAreaGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#0D9488"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#0D9488"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      {chartTimePoints.length >
                        1 && (
                        <>
                          <polygon
                            points={`${chartTimePoints[0].x},100 ${chartTimePoints
                              .map(
                                (point) =>
                                  `${point.x},${point.y}`
                              )
                              .join(" ")} ${
                              chartTimePoints[
                                chartTimePoints.length - 1
                              ].x
                            },100`}
                            fill="url(#dashboardEmotionAreaGradient)"
                            stroke="none"
                          />
                          <polyline
                            points={chartTimePoints
                              .map(
                                (
                                  point
                                ) =>
                                  `${point.x},${point.y}`
                              )
                              .join(
                                " "
                              )}
                            fill="none"
                            stroke="#0D9488"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      )}
                    </svg>

                    {/* 포인트 */}

                    {chartTimePoints.map(
                      (
                        point,
                        index
                      ) => (
                        <button
                          key={
                            index
                          }
                          type="button"
                          aria-label={
                            point.tooltip
                          }
                          onMouseEnter={() =>
                            setHoveredChartIndex(
                              index
                            )
                          }
                          onMouseLeave={() =>
                            setHoveredChartIndex(
                              null
                            )
                          }
                          style={{
                            position:
                              "absolute",
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            transform:
                              "translate(-50%, -50%)",
                            width:
                              "12px",
                            height:
                              "12px",
                            padding: 0,
                            border:
                              "2px solid #ffffff",
                            borderRadius:
                              "50%",
                            backgroundColor:
                              "#0D9488",
                            boxShadow:
                              "0 1px 4px rgba(0,0,0,0.15)",
                            cursor:
                              "pointer",
                            zIndex: 5,
                          }}
                        />
                      )
                    )}

                    {/* 툴팁 */}

                    {hoveredChartPoint && (
                      <div
                        style={{
                          position:
                            "absolute",
                          left: `${hoveredChartPoint.x}%`,
                          top: `${hoveredChartPoint.y}%`,
                          transform:
                            "translate(-50%, calc(-100% - 12px))",
                          backgroundColor:
                            "#111827",
                          color:
                            "#ffffff",
                          fontSize:
                            "11px",
                          fontWeight:
                            600,
                          padding:
                            "7px 10px",
                          borderRadius:
                            "7px",
                          whiteSpace:
                            "nowrap",
                          pointerEvents:
                            "none",
                          zIndex: 20,
                        }}
                      >
                        {
                          hoveredChartPoint.tooltip
                        }
                      </div>
                    )}

                    {/* X축 */}

                    <div
                      style={{
                        position:
                          "absolute",
                        left: 0,
                        right: 0,
                        bottom:
                          "-34px",
                        height:
                          "20px",
                      }}
                    >
                      {chartDates.map(
                        (
                          date,
                          index
                        ) => (
                          <span
                            key={toDateKey(
                              date
                            )}
                            style={{
                              position:
                                "absolute",
                              left: `${
                                ((index +
                                  0.5) /
                                  7) *
                                100
                              }%`,
                              transform:
                                "translateX(-50%)",
                              fontSize:
                                "11px",
                              color:
                                "#6b7280",
                              fontWeight:
                                600,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {date.getMonth() +
                              1}
                            /
                            {date.getDate()}
                            (
                            {
                              DAY_LABELS[
                                date.getDay()
                              ]
                            }
                            )
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {chartTimePoints.length ===
                  0 && (
                  <div
                    style={{
                      marginTop:
                        "24px",
                      padding:
                        "12px 0 0",
                      textAlign:
                        "center",
                      color:
                        "#9ca3af",
                      fontSize:
                        "13px",
                    }}
                  >
                    해당 주간에 상담 기록이 없습니다.
                  </div>
                )}
              </div>
            )}
            </section>

            {/* =================================================
              주간 감정 요약 / 추천 음악
          ================================================= */}

          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "24px",
              backgroundColor: "#ffffff",
              boxSizing: "border-box",
            }}
          >
            {/* 이번 주 감정 요약 */}

            <section
              style={{
                minWidth: 0,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                <span>
                  {weeklyDominantIndex !== null
                    ? EMOTION_LABELS[
                        weeklyDominantIndex
                      ].emoji
                    : "🗓️"}
                </span>
                이번 주 감정 요약
              </h3>

              <p
                style={{
                  margin:
                    "12px 0 0",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "#6b7280",
                }}
              >
                {!selectedDate
                  ? "캘린더에서 날짜를 선택해주세요."
                  : weeklyDominantLabel
                  ? `이번 주는 '${weeklyDominantLabel}' 감정이 가장 많이 나타났어요.`
                  : "이번 주에는 아직 상담 기록이 없어요."}
              </p>
            </section>

            {/* 맞춤 음악 추천 */}

            <section
              style={{
                minWidth: 0,
                paddingTop: "20px",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                <span>🎵</span>
                맞춤 음악 추천
              </h3>

              <div
                style={{
                  marginTop: "12px",
                }}
              >
                {!selectedDate ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                      lineHeight: 1.7,
                    }}
                  >
                    캘린더에서 날짜를 선택해주세요.
                  </p>
                ) : weeklyMusicLoading ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    추천 음악을 불러오는 중입니다...
                  </p>
                ) : weeklyMusicError ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    추천 음악을 불러오지 못했습니다.
                  </p>
                ) : weeklyMusic.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                      lineHeight: 1.7,
                    }}
                  >
                    {weeklyDominantLabel
                      ? `'${weeklyDominantLabel}' 감정에 등록된 추천 음악이 아직 없어요.`
                      : "추천을 받으려면 이번 주 상담 기록이 필요해요."}
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      maxHeight: "144px",
                      overflowY: "auto",
                      paddingRight: "8px",
                    }}
                  >
                    {weeklyMusic.map(
                      (music) => (
                        <div
                          key={
                            music.music_no
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "40px",
                              height:
                                "40px",
                              borderRadius:
                                "10px",
                              background:
                                "linear-gradient(135deg, #1F6170, #2d8a9e)",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                              color:
                                "#ffffff",
                              boxShadow:
                                "0 2px 6px rgba(0,0,0,0.08)",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9 18V5l12-2v13" />
                              <circle
                                cx="6"
                                cy="18"
                                r="3"
                              />
                              <circle
                                cx="18"
                                cy="16"
                                r="3"
                              />
                            </svg>
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              height: "40px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize:
                                  "13px",
                                fontWeight:
                                  700,
                                color:
                                  "#111827",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {music.title} - {music.singer}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
            </section>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .dashboard-main {
              padding: 24px 16px 56px !important;
            }

            .dashboard-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 520px) {
            .dashboard-main {
              padding: 16px 12px 40px !important;
            }

            .dashboard-main section {
              padding: 16px !important;
            }

            .daily-photo-grid {
              gap: 12px !important;
            }
          }
        `}</style>
      </main>
    );
  }

  /* =======================================================
     로그아웃 상태
     
     기존 MainPage
  ======================================================= */

  return (
    <main
      className="landing-main"
      style={{
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        padding: 0,
        overflowX: "hidden",
      }}
    >
      {/* ===================================================
          VIDEO
      =================================================== */}

      <section
        className="landing-hero"
        style={{
          width: "100vw",
          marginTop: 30,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          className="landing-hero-media"
          style={{
            position: "relative",
            width: "100vw",
            height:
              "max(250px, calc(56.25vw - 350px))",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            src={test1}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              width: "100vw",
              height: "auto",
              left: 0,
              top: "calc(50% - 20px)",
              transform:
                "translateY(-50%)",
              display: "block",
            }}
          />

          {/* 기존 텍스트 */}

          <div
            className="landing-hero-copy"
            style={{
              position: "absolute",
              left: "4%",
              top: "70%",
              transform:
                "translateY(-50%)",
              zIndex: 10,
              color: "#000000",
              fontSize: "130px",
              fontWeight: 900,
              letterSpacing: "-8px",
              lineHeight: 1.15,
              whiteSpace:
                "nowrap",
              textAlign: "left",
              pointerEvents:
                "none",
            }}
          >
            <div>이야기를 듣고</div>
            <div>표정을 읽는다.</div>
          </div>
        </div>
      </section>

      {/* 영상 아래 여백 */}

      <div
        className="landing-hero-spacer"
        style={{
          width: "100vw",
          height: "180px",
        }}
      />

      {/* ===================================================
          SLIDER
      =================================================== */}

      <section
        className="landing-slider"
        style={{
          position: "relative",
          width: "100vw",
          height: "500px",
          marginBottom: "80px",
          backgroundColor:
            "#f5f5f5",
          overflow: "hidden",
          userSelect:
            "none",
        }}
      >
        <div
          className="landing-slider-viewport"
          onMouseDown={(e) =>
            handleTouchStart(
              e.clientX
            )
          }
          onMouseMove={(e) =>
            handleTouchMove(
              e.clientX
            )
          }
          onMouseUp={
            handleTouchEnd
          }
          onMouseLeave={
            handleTouchEnd
          }
          onTouchStart={(e) =>
            handleTouchStart(
              e.touches[0]
                .clientX
            )
          }
          onTouchMove={(e) =>
            handleTouchMove(
              e.touches[0]
                .clientX
            )
          }
          onTouchEnd={
            handleTouchEnd
          }
          style={{
            position:
              "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "500px",
            overflow:
              "hidden",
            cursor: isDragging
              ? "grabbing"
              : "grab",
          }}
        >
          <div
            className="landing-slider-track"
            onTransitionEnd={
              handleTransitionEnd
            }
            style={{
              position:
                "absolute",
              top: 0,
              left:
                slideDirection === 1
                  ? 0
                  : "-100vw",
              width: "200vw",
              height: "500px",
              display:
                "flex",
              transform:
                slideDirection === 1
                  ? isAnimating
                    ? "translateX(-100vw)"
                    : "translateX(0)"
                  : isAnimating
                  ? "translateX(100vw)"
                  : "translateX(0)",
              transition:
                isAnimating
                  ? "transform 500ms ease-in-out"
                  : "none",
            }}
          >
            <div
              className="landing-slide"
              style={{
                flex:
                  "0 0 100vw",
                width: "100vw",
              height: "500px",
              display:
                "flex",
              position: "relative",
              alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <img
                className="landing-slide-image"
                src={
                  slideDirection ===
                  1
                    ? baseSlides[
                        currentSlide
                      ].image
                    : baseSlides[
                        targetSlide
                      ].image
                }
                alt=""
                draggable={false}
                style={{
                  height:
                    "400px",
                  width: "auto",
                  maxWidth:
                    "none",
                  objectFit:
                    "contain",
                  transform:
                    `translateX(${(slideDirection === 1
                      ? baseSlides[currentSlide]
                      : baseSlides[targetSlide]
                    ).imageOffset})`,
                  userSelect:
                    "none",
                  pointerEvents:
                    "none",
                }}
              />
              {(slideDirection === 1
                ? baseSlides[currentSlide]
                : baseSlides[targetSlide]
              ).title && (
                <div
                  className="landing-slide-copy"
                  style={{
                    position: "absolute",
                    left: "calc(50% + 16px)",
                    top: "calc(50% + 130px)",
                    transform: "translateY(-50%)",
                    color: "#111827",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 15px",
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "#0D9488",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[currentSlide]
                      : baseSlides[targetSlide]
                    ).label}
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      lineHeight: 1.3,
                      fontWeight: 800,
                      letterSpacing: "-1.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[currentSlide]
                      : baseSlides[targetSlide]
                    ).title}
                  </h2>
                  <p
                    className="landing-slide-description"
                    style={{
                      margin: "3px 0 0",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      color: "#4b5563",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[currentSlide]
                      : baseSlides[targetSlide]
                    ).descriptionLead}
                  </p>
                  <p
                    className="landing-slide-description"
                    style={{
                      margin: "1px 0 0",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      color: "#4b5563",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[currentSlide]
                      : baseSlides[targetSlide]
                    ).description}
                  </p>
                </div>
              )}
            </div>

            <div
              className="landing-slide"
              style={{
                flex:
                  "0 0 100vw",
                width: "100vw",
              height: "500px",
              display:
                "flex",
              position: "relative",
              alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <img
                className="landing-slide-image"
                src={
                  slideDirection ===
                  1
                    ? baseSlides[
                        targetSlide
                      ].image
                    : baseSlides[
                        currentSlide
                      ].image
                }
                alt=""
                draggable={false}
                style={{
                  height:
                    "400px",
                  width: "auto",
                  maxWidth:
                    "none",
                  objectFit:
                    "contain",
                  transform:
                    `translateX(${(slideDirection === 1
                      ? baseSlides[targetSlide]
                      : baseSlides[currentSlide]
                    ).imageOffset})`,
                  userSelect:
                    "none",
                  pointerEvents:
                    "none",
                }}
              />
              {(slideDirection === 1
                ? baseSlides[targetSlide]
                : baseSlides[currentSlide]
              ).title && (
                <div
                  className="landing-slide-copy"
                  style={{
                    position: "absolute",
                    left: "calc(50% + 16px)",
                    top: "calc(50% + 130px)",
                    transform: "translateY(-50%)",
                    color: "#111827",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 15px",
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "#0D9488",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[targetSlide]
                      : baseSlides[currentSlide]
                    ).label}
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      lineHeight: 1.3,
                      fontWeight: 800,
                      letterSpacing: "-1.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[targetSlide]
                      : baseSlides[currentSlide]
                    ).title}
                  </h2>
                  <p
                    className="landing-slide-description"
                    style={{
                      margin: "3px 0 0",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      color: "#4b5563",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[targetSlide]
                      : baseSlides[currentSlide]
                    ).descriptionLead}
                  </p>
                  <p
                    className="landing-slide-description"
                    style={{
                      margin: "3px 0 0",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      color: "#4b5563",
                    }}
                  >
                    {(slideDirection === 1
                      ? baseSlides[targetSlide]
                      : baseSlides[currentSlide]
                    ).description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 왼쪽 화살표 */}

        <button
          className="landing-slider-arrow landing-slider-arrow-left"
          type="button"
          onClick={
            prevSlide
          }
          aria-label="이전 이미지"
          style={{
            position:
              "absolute",
            left: "30px",
            top: "50%",
            transform:
              "translateY(-50%)",
            zIndex: 100,
            width: "40px",
            height: "40px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            borderRadius:
              "50%",
            border:
              "1px solid #dddddd",
            backgroundColor:
              "#ffffff",
            color:
              "#333333",
            padding: 0,
            cursor:
              "pointer",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              lineHeight: 1,
              transform: "translateY(-1px)",
            }}
          >
            ‹
          </span>
        </button>

        {/* 오른쪽 화살표 */}

        <button
          className="landing-slider-arrow landing-slider-arrow-right"
          type="button"
          onClick={
            nextSlide
          }
          aria-label="다음 이미지"
          style={{
            position:
              "absolute",
            right: "30px",
            top: "50%",
            transform:
              "translateY(-50%)",
            zIndex: 100,
            width: "40px",
            height: "40px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            borderRadius:
              "50%",
            border:
              "1px solid #dddddd",
            backgroundColor:
              "#ffffff",
            color:
              "#333333",
            padding: 0,
            cursor:
              "pointer",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              lineHeight: 1,
              transform: "translateY(-1px)",
            }}
          >
            ›
          </span>
        </button>

        {/* 인디케이터 */}

        <div
          style={{
            position:
              "absolute",
            left: "50%",
            bottom: "15px",
            transform:
              "translateX(-50%)",
            zIndex: 100,
            display:
              "flex",
            alignItems:
              "center",
            gap: "8px",
          }}
        >
          {baseSlides.map(
            (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (
                    !isAnimating
                  ) {
                    setCurrentSlide(
                      index
                    );
                  }
                }}
                aria-label={`${index + 1}번째 슬라이드`}
                style={{
                  width:
                    currentSlide ===
                    index
                      ? "10px"
                      : "8px",
                  height:
                    currentSlide ===
                    index
                      ? "10px"
                      : "8px",
                  padding: 0,
                  border:
                    "none",
                  borderRadius:
                    "50%",
                  backgroundColor:
                    currentSlide ===
                    index
                      ? "#0D9488"
                      : "#cfcfcf",
                  cursor:
                    "pointer",
                }}
              />
            )
          )}
        </div>
      </section>
      <style>{`
        @media (max-width: 900px) {
          .landing-hero-media {
            height: max(300px, 46vw) !important;
          }

          .landing-hero-copy {
            font-size: clamp(48px, 8vw, 88px) !important;
            letter-spacing: -5px !important;
          }

          .landing-hero-spacer {
            height: 100px !important;
          }

          .landing-slider,
          .landing-slider-viewport,
          .landing-slider-track,
          .landing-slide {
            height: 480px !important;
          }

          .landing-slide-image {
            height: 320px !important;
            max-width: 46vw !important;
            transform: translateX(-22vw) !important;
          }

          .landing-slide-copy {
            left: 55% !important;
            top: calc(50% + 110px) !important;
            max-width: 40vw;
          }

          .landing-slide-copy > p:first-child {
            font-size: 26px !important;
          }

          .landing-slide-copy h2 {
            font-size: 20px !important;
            white-space: normal !important;
          }

          .landing-slide-description {
            font-size: 14px !important;
          }
        }

        @media (max-width: 640px) {
          .landing-hero {
            margin-top: 12px !important;
          }

          .landing-hero-media {
            height: 280px !important;
          }

          .landing-hero-media > video {
            width: auto !important;
            min-width: 100% !important;
            height: 100% !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            object-fit: cover;
          }

          .landing-hero-copy {
            left: 6% !important;
            top: 68% !important;
            font-size: 42px !important;
            letter-spacing: -3px !important;
            line-height: 1.1 !important;
          }

          .landing-hero-spacer {
            height: 64px !important;
          }

          .landing-slider,
          .landing-slider-viewport,
          .landing-slider-track,
          .landing-slide {
            height: 480px !important;
          }

          .landing-slider {
            margin-bottom: 48px !important;
          }

          .landing-slide {
            align-items: center !important;
            padding-top: 0;
          }

          .landing-slide-image {
            position: static;
            height: min(260px, 54vw) !important;
            max-width: 46vw !important;
            transform: translateX(-24vw) !important;
          }

          .landing-slide-copy {
            left: 55% !important;
            right: auto;
            top: calc(50% + 95px) !important;
            max-width: 40vw;
            transform: translateY(-50%) !important;
            text-align: left;
          }

          .landing-slide-copy > p:first-child {
            margin-bottom: 10px !important;
            font-size: clamp(18px, 6vw, 26px) !important;
          }

          .landing-slide-copy h2 {
            font-size: clamp(14px, 4.5vw, 19px) !important;
            letter-spacing: -1px !important;
          }

          .landing-slide-description {
            margin-top: 6px !important;
            font-size: clamp(12px, 3.5vw, 14px) !important;
            line-height: 1.5 !important;
          }

          .landing-slider-arrow {
            width: 36px !important;
            height: 36px !important;
          }

          .landing-slider-arrow-left {
            left: 12px !important;
          }

          .landing-slider-arrow-right {
            right: 12px !important;
          }
        }
      `}</style>
    </main>
  );
}
