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

// 세션이 끊겼을 때(로그인 쿠키 삭제 + 알림 + 메인페이지 이동) 공통 처리
// counsel.ts 등 다른 곳에서도 재사용할 수 있도록 별도 함수로 분리함
export const handleSessionExpired = () => {
  Cookies.remove("isLoggedIn", { path: "/" });
  Cookies.remove("userId", { path: "/" });
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