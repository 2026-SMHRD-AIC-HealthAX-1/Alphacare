// 카카오 로그인 인가 URL 생성 (REST API 키/Redirect URI는 .env에서 관리)
// state로 로그인/회원가입 중 어디서 왔는지 표시 -> 콜백에서 실패 시 원래 페이지로 돌려보냄
export const getKakaoAuthUrl = (state: "login" | "signup" = "login") => {
  const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
  // scope=profile_nickname: 닉네임 동의를 명시적으로 요청 (미지정 시 콘솔 설정에 따라 닉네임이 안 올 수 있음)
  return `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=profile_nickname`;
};
