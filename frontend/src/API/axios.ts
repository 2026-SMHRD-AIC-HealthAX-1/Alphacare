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

// 로그인 성공 시 로그인 상태 쿠키 설정
// expires를 지정하지 않으면 브라우저 세션 쿠키가 됨 - 새로고침에는 영향 없이 유지되고,
// 탭/브라우저를 완전히 닫으면 브라우저가 알아서 삭제해줌 (별도 타이머 로직 불필요)
export const setAuthCookies = (userId: string) => {
  Cookies.set("isLoggedIn", "true", { path: "/" });
  Cookies.set("userId", userId, { path: "/" });
};

// 로그인 관련 쿠키 삭제 (로그아웃 / 세션만료 등에서 재사용)
export const clearAuthCookies = () => {
  Cookies.remove("isLoggedIn", { path: "/" });
  Cookies.remove("userId", { path: "/" });
};

// 세션이 끊겼을 때(로그인 쿠키 삭제 + 알림 + 메인페이지 이동) 공통 처리
// counsel.ts 등 다른 곳에서도 재사용할 수 있도록 별도 함수로 분리함
//
// 한 화면에서 API 요청이 여러 개 동시에 나가는 경우(예: useEffect 여러 개, 혹은 개발 모드
// StrictMode가 effect를 두 번 실행하는 것) 401도 여러 번 같이 오는데, alert()는 화면을 막는
// 동기 함수라 첫 alert가 닫히기 전에 뒤이어 온 401들도 각자 handleSessionExpired를 또 호출해서
// 알림창이 여러 번 뜨는 문제가 있었음 - 플래그로 한 번만 실행되게 막음
let sessionExpiredHandled = false;

export const handleSessionExpired = () => {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

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