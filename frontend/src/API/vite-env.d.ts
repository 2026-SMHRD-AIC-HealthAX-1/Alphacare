/// <reference types="vite/client" />
// 환경변수 타입 정의 (값은 .env에 저장)
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_FASTAPI_BASE_URL: string;
  readonly VITE_KAKAO_REST_API_KEY: string;
  readonly VITE_KAKAO_REDIRECT_URI: string;
  // 환경변수 추가 시 아래에 선언
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}