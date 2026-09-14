import { useState } from "react";

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

export default function CounselCalendar() {
  const [selectedDate] = useState("2026.06.15");

  const [logs] = useState<CounselingLog[]>([
    {
      id: "log-200",
      time: "회차 (200px)",
      emotionEmoji: "😃",
      emotionLabel: "감정",
      emotionScore: "감정 추정치",
      summary: ["상담 요약 출력 구간"],
      imageSize: 200,
      imageUrl: "https://via.placeholder.com/200x200?text=200x200",
    }, 
    {
      id: "log-201",
      time: "회차 (200px)",
      emotionEmoji: "😃",
      emotionLabel: "감정",
      emotionScore: "감정 추정치",
      summary: ["상담 요약 출력 구간"],
      imageSize: 200,
      imageUrl: "https://via.placeholder.com/200x200?text=200x200",
    },
  ]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 캘린더 영역 */}
      <section className="col-span-12 lg:col-span-4 border rounded-xl p-6 flex items-center justify-center min-h-[400px] h-fit border-gray-300 dark:border-gray-700">
        <span className="text-xl font-bold text-black-900 dark:text-black-100">달력 영역</span>
      </section>

      {/* 상담 기록 영역 */}
      <section className="col-span-12 lg:col-span-8 border rounded-xl p-6 border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-bold text-black-900 dark:text-black-100 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          {selectedDate} 오후 01:00시 (월) 상담 기록
        </h2>

        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-300 rounded-lg p-5 space-y-4 dark:border-gray-700"
            >
              {/* 헤더 정보 */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 dark:border-gray-700">
                <span className="font-bold text-black-900 text-base dark:text-black-100">
                  {log.time}
                </span>
                <span className="text-black-900 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-900 dark:text-black-100 dark:border-gray-100">
                  {log.emotionEmoji} {log.emotionLabel} ({log.emotionScore}%)
                </span>
              </div>

              {/* 스냅샷 및 설명 */}
              <div className="flex flex-col md:flex-row gap-5 items-start">
                <div className="flex-shrink-0">
                  <img
                    src={log.imageUrl}
                    alt={`표정 스냅샷 ${log.imageSize}px`}
                    style={{
                      width: `${log.imageSize}px`,
                      height: `${log.imageSize}px`,
                    }}
                    className="object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                  />
                </div>

                <div className="flex-1 space-y-2 text-sm text-black-900 dark:text-black-100">
                  <p className="font-bold text-black-900 dark:text-black-100 text-base mb-2">
                    상담 요약 및 특징
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-black-800 dark:text-black-200">
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
    </div>
  );
}