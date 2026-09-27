// 음악 추천 조회
import { api } from "./axios";

// 추천 음악 타입
export interface MusicRecommendation {
  music_no: number;
  title: string;
  singer: string;
  genre: string;
}

// 감정(장르)별 추천 음악 조회

export const getRecommendedMusic = async (
  genre: string
): Promise<MusicRecommendation[]> => {
  const response = await api.get<MusicRecommendation[]>("/api/music/recommend", {
    params: { genre },
  });
  return response.data ?? [];
};

// 등록된 추천 음악 전체 조회 (관리자 화면용)
export const getAllMusic = async (): Promise<MusicRecommendation[]> => {
  const response = await api.get<MusicRecommendation[]>("/api/music/all");
  return response.data ?? [];
};

// 추천 음악 등록 (관리자 전용)
export const createMusic = async (title: string, singer: string, genre: string): Promise<void> => {
  await api.get("/api/music/setRecommend", { params: { title, singer, genre } });
};

// 추천 음악 수정 (관리자 전용)
export const updateMusic = async (musicNo: number, title: string, singer: string, genre: string): Promise<void> => {
  await api.get("/api/music/updateRecommend", { params: { music_no: musicNo, title, singer, genre } });
};

// 추천 음악 삭제 (관리자 전용)
export const deleteMusic = async (musicNo: number): Promise<void> => {
  await api.delete(`/api/music/${musicNo}`);
};
