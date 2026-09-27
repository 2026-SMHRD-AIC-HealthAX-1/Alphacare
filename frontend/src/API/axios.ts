import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

const URL = import.meta.env.VITE_API_BASE_URL;

// 백엔드 에러 응답 타입
export type ApiError = AxiosError<{ message?: string }>;

export const api = axios.create({
  baseURL : URL,
  headers : {
    "Content-Type" : "application/json",
  },
  withCredentials : true,
  timeout : 5000,
});

// 로그인 상태 쿠키 설정 (브라우저 세션 쿠키)
export const setAuthCookies = (userId: string) => {
  Cookies.set("isLoggedIn", "true", { path: "/" });
  Cookies.set("userId", userId, { path: "/" });
};

// 로그인 쿠키 삭제
export const clearAuthCookies = () => {
  Cookies.remove("isLoggedIn", { path: "/" });
  Cookies.remove("userId", { path: "/" });
};

// 세션 만료 공통 처리 (쿠키 삭제, 알림, 메인 이동 / 중복 실행 방지)
let sessionExpiredHandled = false;

export const handleSessionExpired = () => {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  clearAuthCookies();
  alert("세션이 만료되었습니다. 다시 로그인해주세요.");
  window.location.href = import.meta.env.BASE_URL;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleSessionExpired();
    }
    return Promise.reject(error);
  }
);