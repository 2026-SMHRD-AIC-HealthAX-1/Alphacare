/// <reference types="vite/client" />
//타입 정의 구문만 사용, 실제 API값은 .env파일에 저장
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 추가로 사용하는 API 키나 환경변수가 있다면 아래에 추가 지정
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}