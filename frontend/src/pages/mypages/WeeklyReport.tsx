import { useEffect, useState } from "react";
import { getCounselData, CounselRecord } from "../../API/counsel";
import { getRecommendedMusic, MusicRecommendation } from "../../API/music";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 감정분류(e01~e06) 라벨/이모지 - EmotionCalender.tsx와 동일한 순서
const EMOTION_LABELS: { key: keyof CounselRecord; label: string; emoji: string }[] = [
  { key: "e01Rate", label: "중립", emoji: "😐" },
  { key: "e02Rate", label: "기쁨", emoji: "😃" },
  { key: "e03Rate", label: "슬픔", emoji: "😢" },
  { key: "e04Rate", label: "분노", emoji: "😡" },
  { key: "e05Rate", label: "당황", emoji: "😳" },
  { key: "e06Rate", label: "불안", emoji: "😰" },
];

// 주어진 날짜가 속한 주의 월요일 반환 (일요일이면 전주 월요일 취급)
const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0(일)~6(토)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 월요일 기준으로 월~일 7일치 Date 배열 생성
const getWeekDates = (monday: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

// 헤더에 표시할 "9월 15일 - 9월 21일" 형태 문자열
const formatWeekRange = (monday: Date) => {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${monday.getMonth() + 1}월 ${monday.getDate()}일 - ${sunday.getMonth() + 1}월 ${sunday.getDate()}일`;
};

// X축에 표시할 "15(월)" 형태 문자열
const formatDayLabel = (date: Date) => `${date.getDate()}(${DAY_LABELS[date.getDay()]})`;

// "YYYY-MM-DD HH:mm:ss" -> 날짜 부분만
const dateOnly = (dttm: string) => dttm.split(" ")[0];

// "YYYY-MM-DD HH:mm:ss" -> Date 객체 (공백을 T로 바꿔 안전하게 파싱)
const parseDttm = (dttm: string) => {
  const [datePart, timePart] = dttm.split(" ");
  return new Date(`${datePart}T${timePart ?? "00:00:00"}`);
};

// Date -> "YYYY-MM-DD" (로컬 기준)
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// 여러 상담 기록의 감정 비율을 합산해 가장 높은 감정의 인덱스를 반환 (기록 없으면 null)
const getDominantEmotionIndex = (dayLogs: CounselRecord[]) => {
  if (dayLogs.length === 0) return null;

  const sums = EMOTION_LABELS.map(() => 0);
  dayLogs.forEach((log) => {
    EMOTION_LABELS.forEach((e, i) => {
      sums[i] += Number(log[e.key]) || 0;
    });
  });

  let maxIndex = 0;
  sums.forEach((v, i) => {
    if (v > sums[maxIndex]) maxIndex = i;
  });
  return maxIndex;
};

export default function EmotionGraph() {
  // 이번 주 월요일을 기준으로 관리 (이전/다음 버튼으로 한 주씩 이동)
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const weekDates = getWeekDates(weekStart);

  // 로그인한 회원의 상담 기록 전체
  const [logs, setLogs] = useState<CounselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 이번 주 대표 감정 기반 추천 음악
  const [music, setMusic] = useState<MusicRecommendation[]>([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState(false);

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

  const goToPrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  // 지금 보고 있는 주(월~일)에 해당하는 기록만 필터링
  const weekDateKeys = weekDates.map(toDateKey);
  const weekLogs = logs.filter((log) => weekDateKeys.includes(dateOnly(log.counselDttm)));

  // 이번 주 전체 기록으로 대표 감정을 구해 음악 추천 조회
  useEffect(() => {
    const weekIndex = getDominantEmotionIndex(weekLogs);

    if (weekIndex === null) {
      setMusic([]);
      return;
    }

    const label = EMOTION_LABELS[weekIndex].label;

    const loadMusic = async () => {
      try {
        setMusicLoading(true);
        setMusicError(false);
        const data = await getRecommendedMusic(label);
        setMusic(data);
      } catch (err) {
        console.error("추천 음악을 불러오지 못했습니다:", err);
        setMusicError(true);
      } finally {
        setMusicLoading(false);
      }
    };

    loadMusic();
    // weekStart가 바뀌거나 상담 기록이 새로 로드될 때만 다시 조회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, logs]);

  const weekDominantIndex = getDominantEmotionIndex(weekLogs);
  const weekDominantLabel = weekDominantIndex === null ? null : EMOTION_LABELS[weekDominantIndex].label;

  // 상담 기록 하나하나를 실제 상담 시각(요일+시간) 기준으로 좌표화
  // x: 이번 주 월요일 0시 ~ 다음 주 월요일 0시를 0~100으로 환산한 위치
  // y: 해당 상담의 대표 감정 카테고리 위치
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const timePoints = weekLogs
    .map((log) => {
      const idx = getDominantEmotionIndex([log]);
      if (idx === null) return null;

      const time = parseDttm(log.counselDttm);
      const x = Math.min(100, Math.max(0, ((time.getTime() - weekStart.getTime()) / WEEK_MS) * 100));
      const y = (idx / (EMOTION_LABELS.length - 1)) * 100;
      const hh = String(time.getHours()).padStart(2, "0");
      const mm = String(time.getMinutes()).padStart(2, "0");

      return { x, y, tooltip: `${formatDayLabel(time)} ${hh}:${mm} · ${EMOTION_LABELS[idx].label}` };
    })
    .filter((p): p is { x: number; y: number; tooltip: string } => p !== null)
    .sort((a, b) => a.x - b.x);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-gray-700">
        감정 그래프
      </h1>

      {/* 주간 감정 리포트 메인 카드 */}
      <div className="border border-gray-300 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-6">
        {/* 날짜 이동 헤더: 클릭 시 해당 주(월~일)만 표시되도록 이동 */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goToPrevWeek}
            className="text-gray-800 hover:text-black dark:text-gray-300 dark:hover:text-white font-bold text-lg"
          >
            &lt;
          </button>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatWeekRange(weekStart)}
          </span>
          <button
            onClick={goToNextWeek}
            className="text-gray-800 hover:text-black dark:text-gray-300 dark:hover:text-white font-bold text-lg"
          >
            &gt;
          </button>
        </div>

        {/* 그래프 영역 */}
        <div className="border border-gray-300 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">일주일 동안의 감정 변화</h3>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
              상담 기록을 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
              상담 기록을 불러오지 못했습니다. 로그인 상태를 확인해주세요.
            </div>
          ) : (
            <div className="flex h-56 items-stretch">
              {/* Y축 범주: 실제 감정분류(중립/기쁨/슬픔/분노/당황/불안) */}
              <div className="flex flex-col justify-between text-xs text-gray-900 dark:text-gray-100 pr-4 border-r border-gray-300 dark:border-gray-700 font-bold">
                {EMOTION_LABELS.map((e) => (
                  <span key={e.label} className="flex items-center gap-1">
                    {e.emoji} {e.label}
                  </span>
                ))}
              </div>

              {/* 차트 시각화: 상담 시각(요일+시간)을 실제 데이터로 표시 */}
              <div className="flex-1 flex flex-col justify-between pl-4 relative">
                {EMOTION_LABELS.map((_, i) => (
                  <div
                    key={i}
                    className="w-full border-b border-dashed border-gray-300 dark:border-gray-700 h-0"
                  ></div>
                ))}

                {/* 요일 경계 구분선: 시간축 위에서 날짜가 바뀌는 지점 표시 */}
                {weekDates.slice(1).map((_, i) => (
                  <div
                    key={`divider-${i}`}
                    className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
                    style={{ left: `${((i + 1) / 7) * 100}%` }}
                  ></div>
                ))}

                {/* 상담 시각 간 연결선 + 데이터 포인트 */}
                <svg
                  className="absolute inset-0 w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  {timePoints.length > 1 && (
                    <polyline
                      points={timePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="var(--color-primary, #1F6170)"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {timePoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="2.2"
                      vectorEffect="non-scaling-stroke"
                      fill="var(--color-primary, #1F6170)"
                    >
                      <title>{p.tooltip}</title>
                    </circle>
                  ))}
                </svg>

                {/* X축 일자: 선택된 주의 월~일 날짜를 각 날짜 구간 중앙에 표시 */}
                <div className="absolute bottom-[-24px] left-4 right-0 text-xs text-gray-900 dark:text-gray-100 font-bold">
                  {weekDates.map((d, i) => (
                    <span
                      key={d.toISOString()}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${((i + 0.5) / 7) * 100}%` }}
                    >
                      {formatDayLabel(d)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 요약 및 추천 음악 2열 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* 이번 주 감정 요약 */}
          <div className="border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">이번 주 감정 요약</h4>
            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed pt-1 font-medium">
              {weekDominantLabel
                ? `이번 주는 '${weekDominantLabel}' 감정이 가장 많이 나타났어요.`
                : "이번 주에는 아직 상담 기록이 없어요."}
            </p>
          </div>

          {/* 맞춤 음악 추천 */}
          <div className="border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">맞춤 음악 추천</h4>

            {!weekDominantLabel ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                추천을 받으려면 이번 주 상담 기록이 필요해요.
              </p>
            ) : musicLoading ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">추천 음악을 불러오는 중입니다...</p>
            ) : musicError ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">추천 음악을 불러오지 못했습니다.</p>
            ) : music.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                '{weekDominantLabel}' 감정에 등록된 추천 음악이 아직 없어요.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {music.map((m) => (
                  <div key={m.music_no} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 flex-shrink-0"></div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{m.title}</p>
                      <p className="text-gray-700 dark:text-gray-300">{m.singer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
