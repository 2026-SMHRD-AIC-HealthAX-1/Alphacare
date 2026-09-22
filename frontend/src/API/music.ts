// 음악 추천 조회
import { api } from "./axios";

// 백엔드 MusicEntity와 매칭되는 타입
export interface MusicRecommendation {
  music_no: number;
  title: string;
  singer: string;
  genre: string;
}

// getMusic() actually returns ResponseEntity<List<MusicDto>> - a bare array,
// not wrapped in { musicList, musicFlag, message }. Parsing it as a wrapper made
// response.data.musicList always undefined, so the recommendation list was always empty.

export const getRecommendedMusic = async (
  genre: string
): Promise<MusicRecommendation[]> => {
  const response = await api.get<MusicRecommendation[]>("/api/music/recommend", {
    params: { genre },
  });
  return response.data ?? [];
};
