// 상담 감정 점수(e01~e06) 관련 공용 로직 - MainPage / EmotionCalender / WeeklyReport가 각자
// 따로 들고 있던 걸 하나로 모음 (라벨/이모지, 대표 감정 계산, 퍼센트 변환)
import { CounselRecord } from "../API/counsel";

// 감정분류(e01~e06) 코드에 대응하는 라벨/이모지
export const EMOTION_LABELS: { key: keyof CounselRecord; label: string; emoji: string }[] = [
  { key: "e01Rate", label: "중립", emoji: "😐" },
  { key: "e02Rate", label: "기쁨", emoji: "😃" },
  { key: "e03Rate", label: "슬픔", emoji: "😢" },
  { key: "e04Rate", label: "분노", emoji: "😡" },
  { key: "e05Rate", label: "당황", emoji: "😳" },
  { key: "e06Rate", label: "불안", emoji: "😰" },
];

// 6개 감정 점수 중 가장 높은 값을 대표 감정으로 결정
export const getDominantEmotion = (log: CounselRecord) => {
  return EMOTION_LABELS.reduce((max, current) =>
    Number(log[current.key]) > Number(log[max.key]) ? current : max
  );
};

// 여러 상담 기록의 감정 비율을 합산해 가장 높은 감정의 인덱스를 반환 (기록 없으면 null)
export const getDominantEmotionIndex = (dayLogs: CounselRecord[]) => {
  if (dayLogs.length === 0) return null;

  const sums = EMOTION_LABELS.map(() => 0);
  dayLogs.forEach((log) => {
    EMOTION_LABELS.forEach((emotion, index) => {
      sums[index] += Number(log[emotion.key]) || 0;
    });
  });

  let maxIndex = 0;
  sums.forEach((value, index) => {
    if (value > sums[maxIndex]) maxIndex = index;
  });

  return maxIndex;
};

// 감정 점수(0~1 비율, 6개 합이 1)를 화면에 보여줄 정수 퍼센트로 변환
// AI 서버가 0~1 사이 값으로 내려주므로 그냥 toFixed(0)만 하면 항상 0 아니면 1로 보임 - 100을 곱해야 함
export const formatEmotionPercent = (rate: number | string | null | undefined): number => {
  return Math.round(Number(rate ?? 0) * 100);
};
