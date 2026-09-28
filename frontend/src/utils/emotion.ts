// 상담 감정 점수(e01~e06) 공용 로직 (라벨/이모지, 대표 감정, 퍼센트 변환)
import { CounselRecord } from "../API/counsel";

// 감정분류(e01~e06) 코드에 대응하는 라벨/이모지
export const EMOTION_LABELS: { key: keyof CounselRecord; label: string; emoji: string }[] = [
  { key: "e01Rate", label: "중립", emoji: "😐" },
  { key: "e02Rate", label: "기쁨", emoji: "😃" },
  { key: "e03Rate", label: "슬픔", emoji: "😢" },
  { key: "e04Rate", label: "화남", emoji: "😡" },
  { key: "e05Rate", label: "우울", emoji: "😔" },
  { key: "e06Rate", label: "불안", emoji: "😰" },
];

// 6개 감정 점수 중 가장 높은 값을 대표 감정으로 결정
export const getDominantEmotion = (log: CounselRecord) => {
  return EMOTION_LABELS.reduce((max, current) =>
    Number(log[current.key]) > Number(log[max.key]) ? current : max
  );
};

// 여러 상담 기록 중 대표 감정으로 가장 많이 나온 감정의 인덱스 (기록 없으면 null)
// 동률이면 점수 합이 더 높은 감정을 대표 감정으로 선택
export const getDominantEmotionIndex = (dayLogs: CounselRecord[]) => {
  if (dayLogs.length === 0) return null;

  const counts = EMOTION_LABELS.map(() => 0);
  const sums = EMOTION_LABELS.map(() => 0);

  dayLogs.forEach((log) => {
    const topEmotion = getDominantEmotion(log);
    counts[EMOTION_LABELS.indexOf(topEmotion)] += 1;
    EMOTION_LABELS.forEach((emotion, index) => {
      sums[index] += Number(log[emotion.key]) || 0;
    });
  });

  let maxIndex = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] > counts[maxIndex] || (counts[i] === counts[maxIndex] && sums[i] > sums[maxIndex])) {
      maxIndex = i;
    }
  }

  return maxIndex;
};

// 감정 점수(0~1)를 정수 퍼센트로 변환
export const formatEmotionPercent = (rate: number | string | null | undefined): number => {
  return Math.round(Number(rate ?? 0) * 100);
};
