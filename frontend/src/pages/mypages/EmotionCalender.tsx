import { useState, useEffect, useRef } from "react";
import "cally";
import { getCounselData, CounselRecord } from "../../API/counsel";

// 감정분류(e01~e06) 코드에 대응하는 라벨/이모지
const EMOTION_LABELS: { key: keyof CounselRecord; label: string; emoji: string }[] = [
  { key: "e01Rate", label: "중립", emoji: "😐" },
  { key: "e02Rate", label: "기쁨", emoji: "😃" },
  { key: "e03Rate", label: "슬픔", emoji: "😢" },
  { key: "e04Rate", label: "분노", emoji: "😡" },
  { key: "e05Rate", label: "당황", emoji: "😳" },
  { key: "e06Rate", label: "불안", emoji: "😰" },
];

// 6개 감정 점수 중 가장 높은 값을 대표 감정으로 결정
const getDominantEmotion = (log: CounselRecord) => {
  return EMOTION_LABELS.reduce((max, cur) =>
    Number(log[cur.key]) > Number(log[max.key]) ? cur : max
  );
};

// "YYYY-MM-DD HH:mm:ss" -> 캘린더 매칭/표시용으로 분리
const splitDttm = (dttm: string) => {
  const [datePart, timePart] = dttm.split(" ");
  return { datePart, timePart: timePart ? timePart.slice(0, 5) : "" };
};

export default function MyPageCalendarContent() {
  const [date, setDate] = useState<Date | null>(null);
  // 캘린더에서 선택한 날짜의 원본 문자열(YYYY-MM-DD) - 상담 기록 매칭용
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const calendarRef = useRef<any>(null);

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

  useEffect(() => {
    const calendar = calendarRef.current;

    if (!calendar) return;

    const handleChange = () => {
      const value = calendar.value;

      if (value) {
        setDate(new Date(value));
        setSelectedDateStr(value);
      }
    };

    calendar.addEventListener("change", handleChange);

    return () => {
      calendar.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className="feely-calendar max-w-7xl mx-auto mt-4 sm:mt-8 px-3 sm:px-6">
      <style>{`
        /* 날짜를 클릭하면 배경색이 바뀌도록 처리 (오늘 날짜의 보라색과 구분되는 연한 회색) */
        .feely-calendar .cally::part(button) {
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .feely-calendar .cally::part(selected) {
          background: #d1d5db !important;
          color: #111827 !important;
        }
        .feely-calendar .cally::part(selected):hover {
          background: #d1d5db !important;
        }
        @media (prefers-color-scheme: dark) {
          .feely-calendar .cally::part(selected) {
            background: #4b5563 !important;
            color: #f3f4f6 !important;
          }
          .feely-calendar .cally::part(selected):hover {
            background: #4b5563 !important;
          }
        }
        .feely-calendar .cally::part(button day today) {
          background: var(--color-primary) !important;
          color: var(--color-primary-content) !important;
        }

        /* 캘린더 내부 표(table)가 고정 px 크기로 렌더링되어
                   컨테이너 밖으로 넘치던 문제 수정:
            /* 줄어듦 */
        .feely-calendar .cally::part(container) {
          width: 100%;
          box-sizing: border-box;
        }
        .feely-calendar .cally::part(table) {
          width: 100% !important;
          table-layout: fixed !important;
        }
        .feely-calendar .cally::part(th),
        .feely-calendar .cally::part(td) {
          width: 14.28% !important;
          padding-inline: 0 !important;
        }
        .feely-calendar .cally::part(button) {
          inline-size: auto !important;
          block-size: auto !important;
          width: 100% !important;
          max-width: 2.25rem;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
        }

        /* 캘린더 박스 자체의 츜이: 날짜를 춘생시 크게, 선택 시 부드럽게 줄어듦 */
        .feely-calendar-box {
          width: 100%;
          transition: max-width 0.4s ease-in-out;
        }
      `}</style>

      {/* 2. 메인 콘텐츠 영역 (모바일: 위아래 / md 이상: 좌 캘린더-우 상담기록) */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10">
        {/* 좌측: 캘린더 영역 */}
        <section className="md:col-span-4 md:sticky md:top-8 md:h-fit">
          <div
            className="feely-calendar-box mx-auto"
            style={{ maxWidth: selectedDateStr ? "20rem" : "28rem" }}
          >

            {/* 캘린더 */}
            <calendar-date
              ref={calendarRef}
              class="cally bg-base-100 border border-base-300 shadow-lg rounded-box w-full"
            >
              <svg
                aria-label="Previous"
                className="fill-current size-4"
                slot="previous"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>

              <svg
                aria-label="Next"
                className="fill-current size-4"
                slot="next"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>

              <calendar-month></calendar-month>
            </calendar-date>

          </div>

        </section>
        {/* 우측: 상담 기록 - 날짜를 클릭했을 때만 표시 (클릭 전에는 아무것도 표시하지 않음) */}
        <section className="md:col-span-8">

          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500 border border-dashed dark:border-gray-700 rounded-lg">
              상담 기록을 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500 border border-dashed dark:border-gray-700 rounded-lg">
              상담 기록을 불러오지 못했습니다. 로그인 상태를 확인해주세요.
            </div>
          ) : selectedDateStr ? (
            selectedLogs.length > 0 ? (
              <div className="space-y-4 sm:space-y-6 max-h-[70vh] md:max-h-[800px] overflow-y-auto pr-1 sm:pr-2">
                {selectedLogs.map((log) => {
                  const dominant = getDominantEmotion(log);
                  const { timePart } = splitDttm(log.counselDttm);

                  return (
                    <div
                      key={log.counselNo}
                      className="border dark:border-gray-700 rounded-lg p-4 sm:p-5 space-y-3 sm:space-y-4"
                    >
                      {/* 회차 및 시간/감정 헤더 */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b dark:border-gray-700 pb-3">
                        <span className="font-bold text-[#1F6170] dark:text-teal-400 text-sm sm:text-base">
                          {formattedDate} {timePart}
                        </span>
                        <span className="text-[#1F6170] dark:text-teal-400 text-xs font-bold px-3 py-1.5 rounded-full border border-[#1F6170]">
                          {dominant.emoji} {dominant.label} ({Number(log[dominant.key]).toFixed(0)}%)
                        </span>
                      </div>

                      {/* 시작/종료 이미지 및 요약 */}
                      <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-center md:items-start">
                        <div className="flex-shrink-0 flex gap-2">
                          {log.startImgPath && (
                            <div className="flex flex-col items-center">
                              <img
                                src={log.startImgPath}
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
                          {log.endImgPath && (
                            <div className="flex flex-col items-center">
                              <img
                                src={log.endImgPath}
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
              <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500 border border-dashed dark:border-gray-700 rounded-lg">
                선택한 날짜에 상담 기록이 없습니다.
              </div>
            )
          ) : null}
        </section>
      </main>
    </div>
  );
}
