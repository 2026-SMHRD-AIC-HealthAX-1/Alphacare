import React, { useState } from "react";

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
  const [selectedDate] = useState("2026.06.15");

  const [logs] = useState<CounselingLog[]>([
    {
      id: "log-200",
      time: "날짜 (200px)",
      emotionEmoji: "😃",
      emotionLabel: "감정",
      emotionScore: "감정 추정치",
      summary: ["200x200px 규격 테스트", "상담 요약 출력 구간"],
      imageSize: 200,
      imageUrl: "https://via.placeholder.com/200x200?text=200x200",
    },
  ]);

  return (
    <div className="flex max-w-7xl mx-auto mt-8 px-6 gap-10">
      {/* 1. LNB 좌측 서브메뉴 */}
      <aside className="w-36 flex-shrink-0 space-y-4 border-r pr-6">
        <button className="w-full text-left py-2 px-3 text-gray-600 rounded">
          마이페이지
        </button>
        <button className="w-full text-left py-2 px-3 text-gray-600 rounded">
          감정 그래프
        </button>
        <button className="w-full text-left py-2 px-3 text-[#1F6170] font-bold rounded">
          상담 캘린더
        </button>
      </aside>

      {/* 2. 메인 콘텐츠 영역 (좌: 캘린더 / 우: 상담 기록) */}
      <main className="flex-1 grid grid-cols-12 gap-8">
        {/* 좌측: 캘린더 영역 */}
        <section className="col-span-4 border rounded-xl p-6 flex items-center justify-center min-h-[500px] sticky top-8 h-fit">
          <span className="text-xl font-bold text-gray-500">달력부분</span>
        </section>

        {/* 우측: 상담 기록 이미지 규격 비교 (100px ~ 500px) */}
        <section className="col-span-8 border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">
            {selectedDate} (월) 상담 기록 이미지 규격 비교 (100px ~ 500px)
          </h2>

          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-5 space-y-4"
              >
                {/* 회차 및 시간/감정 헤더 */}
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="font-bold text-[#1F6170] text-base">
                    {log.time}
                  </span>
                  <span className="text-[#1F6170] text-xs font-bold px-3 py-1.5 rounded-full border border-[#1F6170]">
                    {log.emotionEmoji} {log.emotionLabel} ({log.emotionScore}%)
                  </span>
                </div>

                {/* 크기별 이미지 및 설명 */}
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  <div className="flex-shrink-0">
                    <img
                      src={log.imageUrl}
                      alt={`표정 스냅샷 ${log.imageSize}px`}
                      style={{
                        width: `${log.imageSize}px`,
                        height: `${log.imageSize}px`,
                      }}
                      className="object-cover rounded-lg border border-gray-200"
                    />
                    <span className="block text-xs font-bold text-gray-500 text-center mt-2">
                      {log.imageSize} x {log.imageSize} px
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 text-sm text-gray-700 pt-2">
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