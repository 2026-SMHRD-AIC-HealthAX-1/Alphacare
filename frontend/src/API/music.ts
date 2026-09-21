// 음악 추천 조회
import { api } from "./axios";

// 백엔드 MusicEntity와 매칭되는 타입
export interface MusicRecommendation {
  music_no: number;
  title: string;
  singer: string;
  genre: string;
}

// 감정(genre) 문자열로 추천 음악 목록 조회
export const getRecommendedMusic = async (
  genre: string
): Promise<MusicRecommendation[]> => {
  const response = await api.get("/api/music/recommend", {
    params: { genre },
  });
  return response.data;
};
