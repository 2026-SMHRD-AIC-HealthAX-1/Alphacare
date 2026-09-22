import axios from "axios";
import Cookies from "js-cookie";

const URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL : URL,
  headers : {
    "Content-Type" : "application/json",
  },
  withCredentials : true,
  timeout : 5000,
});

// 로그인 쿠키 유지 시간(분). 로그아웃 버튼을 누르면 clearAuthCookies로 바로 지워지므로,
// 이 값은 브라우저를 로그인한 채로 오래 방치했을 때 자동으로 로그아웃 처리되게 하는 안전장치임
// (새로고침에는 영향 없음 - 쿠키라서 새로고침해도 유지됨)
const AUTH_COOKIE_MINUTES = 10;

// 로그인 성공 시 로그인 상태 쿠키 설정
export const setAuthCookies = (userId: string) => {
  const expires = new Date(Date.now() + AUTH_COOKIE_MINUTES * 60 * 1000);
  Cookies.set("isLoggedIn", "true", { expires, path: "/" });
  Cookies.set("userId", userId, { expires, path: "/" });
};

// 로그인 관련 쿠키 삭제 (로그아웃 / 세션만료 등에서 재사용)
export const clearAuthCookies = () => {
  Cookies.remove("isLoggedIn", { path: "/" });
  Cookies.remove("userId", { path: "/" });
};

// 세션이 끊겼을 때(로그인 쿠키 삭제 + 알림 + 메인페이지 이동) 공통 처리
// counsel.ts 등 다른 곳에서도 재사용할 수 있도록 별도 함수로 분리함
export const handleSessionExpired = () => {
  clearAuthCookies();
  alert("세션이 만료되었습니다. 다시 로그인해주세요.");
  window.location.href = "/";
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