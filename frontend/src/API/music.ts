// 음악 추천 조회
import { api } from "./axios";

// 백엔드 MusicEntity와 매칭되는 타입
export interface MusicRecommendation {
  music_no: number;
  title: string;
  singer: string;
  genre: string;
}

// 백엔드가 실제로 감싸서 보내는 응답 형태 (MusicDto: musicList / musicFlag / message)
// 배열이 바로 오는 게 아니라 musicList 안에 들어있어서 그대로 꺼내면 안 됨
interface MusicListResponse {
  musicList: MusicRecommendation[] | null;
  musicFlag: boolean | null;
  message: string | null;
}

// 감정(genre) 문자열로 추천 음악 목록 조회
export const getRecommendedMusic = async (
  genre: string
): Promise<MusicRecommendation[]> => {
  const response = await api.get<MusicListResponse>("/api/music/recommend", {
    params: { genre },
  });
  return response.data.musicList ?? [];
};
