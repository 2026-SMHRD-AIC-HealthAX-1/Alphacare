// 카카오 로그인 인가 URL 생성 (REST API 키/Redirect URI는 .env에서 관리)
export const getKakaoAuthUrl = () => {
  const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
  return `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
};
