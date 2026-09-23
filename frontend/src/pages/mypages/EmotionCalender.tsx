import { useState, useEffect, useMemo } from "react";
import { getCounselData, CounselRecord } from "../../API/counsel";
import { EMOTION_LABELS, getDominantEmotion, formatEmotionPercent } from "../../utils/emotion";

// "YYYY-MM-DD HH:mm:ss" -> 캘린더 매칭/표시용으로 분리
const splitDttm = (dttm: string) => {
  const [datePart, timePart] = dttm.split(" ");
  return { datePart, timePart: timePart ? timePart.slice(0, 5) : "" };
};

// Date -> "YYYY-MM-DD" (로컬 기준, timezone 밀림 방지용으로 직접 조립)
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type CalendarCell = { date: Date; dateStr: string; inCurrentMonth: boolean };

export default function MyPageCalendarContent() {
  const [date, setDate] = useState<Date | null>(null);
  // 캘린더에서 선택한 날짜의 원본 문자열(YYYY-MM-DD) - 상담 기록 매칭용
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  // 캘린더가 현재 보여주고 있는 년/월 (직접 구현한 달력이라 이 값으로 월 이동을 관리함)
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  const [logs, setLogs] = useState<CounselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 로그인한 회원의 상담 기록 전체를 백엔드에서 가져오기
  useEffect(() => {
    const loadCounselData = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await getCounselData();
        setLogs(data);
      } catch (err) {
        console.error("상담 기록을 불러오지 못했습니다:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCounselData();
  }, []);

  const formattedDate = date
    ? `${date.getFullYear()}.${String(
      date.getMonth() + 1
    ).padStart(2, "0")}.${String(
      date.getDate()
    ).padStart(2, "0")}`
    : "날짜를 선택하세요";

  // 선택한 날짜와 일치하는 상담 기록만 필터링
  const selectedLogs = selectedDateStr
    ? logs.filter((log) => splitDttm(log.counselDttm).datePart === selectedDateStr)
    : [];

  // 우측 상담기록 패널을 보여줘야 하는지 여부 (에러/날짜선택 시에만 필요 - 로딩 중에는 큰 캘린더를 그대로 유지)
  // - 이 값에 따라 캘린더가 차지하는 폭도 같이 바뀜: 패널이 없을 땐 캘린더가 넓게, 있을 땐 좁게
  const showDetailsPanel = error || Boolean(selectedDateStr);

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  // 상담 기록이 있는 날짜 -> 대표 감정 이모지 (하루에 여러 건이면 감정 점수가 가장 높은 기록의 감정을 표시)
  const emotionByDate = useMemo(() => {
    const map = new Map<string, { emoji: string; score: number }>();
    logs.forEach((log) => {
      const { datePart } = splitDttm(log.counselDttm);
      const dominant = getDominantEmotion(log);
      const score = Number(log[dominant.key]);
      const existing = map.get(datePart);
      if (!existing || score > existing.score) {
        map.set(datePart, { emoji: dominant.emoji, score });
      }
    });
    return map;
  }, [logs]);

  // 현재 보고 있는 달의 달력 칸 목록 (월요일 시작, 7의 배수로 앞뒤 달 날짜까지 채움)
  const monthCells = useMemo<CalendarCell[]>(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // 일요일=0 ~ 토요일=6 -> 월요일 시작 기준 오프셋으로 변환
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({ date: d, dateStr: toDateStr(d), inCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, dateStr: toDateStr(dt), inCurrentMonth: true });
    }
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const need = 7 - remainder;
      for (let d = 1; d <= need; d++) {
        const dt = new Date(year, month + 1, d);
        cells.push({ date: dt, dateStr: toDateStr(dt), inCurrentMonth: false });
      }
    }

    return cells;
  }, [viewDate]);

  const goToPrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDate = (cell: CalendarCell) => {
    setDate(cell.date);
    setSelectedDateStr(cell.dateStr);
    // 지난/다음 달 날짜를 클릭하면 그 달로 화면도 같이 이동
    if (!cell.inCurrentMonth) {
      setViewDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }
  };

  return (
    <div className="feely-calendar max-w-7xl mx-auto mt-8 sm:mt-14 px-3 sm:px-6">
      <style>{`
        /* 캘린더 박스 자체의 크기: 날짜를 클릭하기 전엔 크게, 선택 시 부드럽게 줄어듦 */
        .feely-calendar-box {
          width: 100%;
          transition: max-width 0.4s ease-in-out;
        }

        /* 상담 요약 패널이 새로 나타날 때 살짝 밀려 들어오며 페이드인 */
        @keyframes feely-summary-in {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .feely-summary-panel {
          animation: feely-summary-in 0.35s ease-out;
        }
      `}</style>

      {/* 2. 메인 콘텐츠 영역 (모바일: 위아래 / md 이상: 좌 캘린더-우 상담기록) */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 min-w-0">
        {/* 좌측: 캘린더 영역 - 상세 패널이 없을 땐 전체 폭, 있을 땐 좁게 */}
        <section
          className={`md:sticky md:top-8 md:h-fit min-w-0 ${showDetailsPanel ? "md:col-span-4" : "md:col-span-12"}`}
        >
          <div
            className="feely-calendar-box border dark:border-gray-700 rounded-2xl shadow-sm p-4 sm:p-6"
            style={{ maxWidth: showDetailsPanel ? "24rem" : "100%" }}
          >
            {/* 상단: 이전/다음 달 이동 + 년/월 표시 */}
            <div className="flex items-center justify-start gap-3 mb-8 sm:mb-10">
              <button
                type="button"
                onClick={goToPrevMonth}
                aria-label="이전 달"
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15.75 19.5 8.25 12l7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                aria-label="다음 달"
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m8.25 4.5 7.5 7.5-7.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>

            {/* 날짜 칸: 상담 기록이 있는 날은 대표 감정 이모지를 같이 표시 */}
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((cell) => {
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selectedDateStr;
                const emotion = emotionByDate.get(cell.dateStr);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(cell)}
                    className={`aspect-square w-full flex flex-col items-center justify-center gap-0.5 rounded-lg text-xs sm:text-sm transition-colors
                      ${cell.inCurrentMonth
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-300 dark:text-gray-600"
                      }
                      ${isSelected
                        ? "bg-[#1F6170] text-white font-bold"
                        : isToday
                          ? "bg-[#0D9488] text-white font-bold hover:bg-[#0b7d73] dark:bg-[#0D9488] dark:text-white dark:hover:bg-[#14b8a6]"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    <span>{cell.date.getDate()}</span>
                    {emotion && (
                      <span
                        className={`leading-none ${showDetailsPanel ? "text-[8px]" : "text-base sm:text-lg"
                          }`}
                      >
                        {emotion.emoji}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        {/* 우측: 상담 기록 - 로딩중/에러/날짜선택 시에만 그리드 칸을 차지하며 렌더링 */}
        {showDetailsPanel && (
        <section className="md:col-span-8 min-w-0">
          {/* 상담 요약 전체를 하나의 보더로 감싸고, 닫기 버튼으로 다시 큰 캘린더로 돌아갈 수 있게 함 */}
          <div className="feely-summary-panel relative border dark:border-gray-700 rounded-lg p-4 sm:p-6">
            {selectedDateStr && (
              <button
                type="button"
                onClick={() => {
                  // 날짜 선택 해제: 상세 패널을 닫고 캘린더를 다시 크게 표시
                  setSelectedDateStr(null);
                  setDate(null);
                }}
                aria-label="상담 요약 닫기"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 text-xl leading-none z-10"
              >
                &times;
              </button>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
                상담 기록을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
                상담 기록을 불러오지 못했습니다. 로그인 상태를 확인해주세요.
              </div>
            ) : selectedDateStr ? (
              selectedLogs.length > 0 ? (
                <div className="space-y-4 sm:space-y-6 max-h-[70vh] md:max-h-[800px] overflow-y-auto pr-1 sm:pr-2">
                  {selectedLogs.map((log, index) => {
                    const dominant = getDominantEmotion(log);
                    const { timePart } = splitDttm(log.counselDttm);

                    return (
                      <div
                        key={log.counselNo}
                        className={`space-y-3 sm:space-y-4 ${index > 0 ? "pt-4 sm:pt-6 border-t dark:border-gray-700" : ""}`}
                      >
                        {/* 회차 및 시간/감정 헤더 */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b dark:border-gray-700 pb-3">
                          <span className="font-bold text-[#1F6170] dark:text-teal-400 text-sm sm:text-base">
                            {formattedDate} {timePart}
                          </span>
                          <span className="relative group text-[#1F6170] dark:text-teal-400 text-xs font-bold px-3 py-1.5 rounded-full border border-[#1F6170] cursor-default">
                            {dominant.emoji} {dominant.label} ({formatEmotionPercent(log[dominant.key])}%)

                            {/* 호버 시 감정 점수 6개를 높은 순으로 보여주는 툴팁
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

                        {/* 시작/종료 이미지 및 요약 */}
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-center md:items-start">
                          <div className="flex-shrink-0 flex gap-2">
                            {log.startImage && (
                              <div className="flex flex-col items-center">
                                <img
                                  src={`data:image/jpeg;base64,${log.startImage}`}
                                  alt="상담 시작 시점 표정"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                  className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                                <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 text-center mt-2">
                                  시작
                                </span>
                              </div>
                            )}
                            {log.endImage && (
                              <div className="flex flex-col items-center">
                                <img
                                  src={`data:image/jpeg;base64,${log.endImage}`}
                                  alt="상담 종료 시점 표정"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                  className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                                <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 text-center mt-2">
                                  종료
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 w-full space-y-2 text-sm text-gray-700 dark:text-gray-300 pt-1 md:pt-2">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-2">
                              상담 요약
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {log.counselSum}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // 상담 기록이 없는 날짜를 선택한 경우
                <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
                  선택한 날짜에 상담 기록이 없습니다.
                </div>
              )
            ) : null}
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
