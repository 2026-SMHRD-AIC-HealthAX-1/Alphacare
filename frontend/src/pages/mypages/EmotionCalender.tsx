import React, { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "cally";

interface CounselingLog {
  id: string;
  time: string;
  emotionEmoji: string;
  emotionLabel: string;
  emotionScore: string;
  summary: string[];
  imageSize: number;
  imageUrl: string;
}

export default function MyPageCalendarContent() {
  const [date, setDate] = useState<Date>(new Date());
  const calendarRef = useRef<any>(null);

  const [logs] = useState<CounselingLog[]>([
    {
      id: "log-200",
      time: "날짜",
      emotionEmoji: "😃",
      emotionLabel: "감정",
      emotionScore: "감정 추정치",
      summary: ["200x200px 규격 테스트", "상담 요약 출력 구간"],
      imageSize: 200,
      imageUrl: "https://via.placeholder.com/200x200?text=200x200",
    },
  ]);

  const formattedDate = date
    ? `${date.getFullYear()}.${String(
      date.getMonth() + 1
    ).padStart(2, "0")}.${String(
      date.getDate()
    ).padStart(2, "0")}`
    : "날짜를 선택하세요";

  useEffect(() => {
    const calendar = calendarRef.current;

    if (!calendar) return;

    const handleChange = () => {
      const value = calendar.value;

      if (value) {
        setDate(new Date(value));
      }
    };

    calendar.addEventListener("change", handleChange);

    return () => {
      calendar.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto mt-4 sm:mt-8 px-3 sm:px-6">

      {/* 2. 메인 콘텐츠 영역 (모바일: 위아래 / md 이상: 좌 캘린더-우 상담기록) */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10">
        {/* 좌측: 캘린더 영역 */}
        <section className="md:col-span-4 md:sticky md:top-8 md:h-fit">
          <div className="w-full max-w-xs mx-auto">

            {/* 안내 문구 */}
            <p className="text-[13px] text-black font-normal text-center md:text-left mb-2">
              상담내역을 확인할 날짜를 선택해주세요.
            </p>

            {/* 캘린더 */}
            <calendar-date
              ref={calendarRef}
              class="cally bg-base-100 border border-base-300 shadow-lg w-full"
            >
              <svg
                aria-label="Previous"
                class="fill-current size-4"
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
                class="fill-current size-4"
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
        {/* 우측: 상담 기록 이미지 규격 비교 (100px ~ 500px) */}
        <section className="md:col-span-8">

          <div className="space-y-4 sm:space-y-6 max-h-[70vh] md:max-h-[800px] overflow-y-auto pr-1 sm:pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 sm:p-5 space-y-3 sm:space-y-4"
              >
                {/* 회차 및 시간/감정 헤더 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <span className="font-bold text-[#1F6170] text-sm sm:text-base">
                    {formattedDate}
                  </span>
                  <span className="text-[#1F6170] text-xs font-bold px-3 py-1.5 rounded-full border border-[#1F6170]">
                    {log.emotionEmoji} {log.emotionLabel} ({log.emotionScore}%)
                  </span>
                </div>

                {/* 크기별 이미지 및 설명 */}
                <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-center md:items-start">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <img
                      src={log.imageUrl}
                      alt={`표정 스냅샷 ${log.imageSize}px`}
                      style={{
                        width: `${log.imageSize}px`,
                        height: `${log.imageSize}px`,
                        maxWidth: "100%",
                      }}
                      className="object-cover rounded-lg border border-gray-200"
                    />
                    <span className="block text-xs font-bold text-gray-500 text-center mt-2">
                      {log.imageSize} x {log.imageSize} px
                    </span>
                  </div>

                  <div className="flex-1 w-full space-y-2 text-sm text-gray-700 pt-1 md:pt-2">
                    <p className="font-semibold text-gray-900 text-base mb-2">
                      상담 요약 및 규격 특징
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                      {log.summary.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
