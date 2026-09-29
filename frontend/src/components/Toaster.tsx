import { useEffect, useSyncExternalStore } from "react";
import {
  subscribeToasts,
  getToasts,
  dismissToast,
  flushPendingToast,
  TOAST_DURATION_MS,
  ToastType,
} from "../utils/toast";

// 토스트 종류별 색상 (왼쪽 포인트 색, 아이콘 배경, 진행바)
const TOAST_STYLES: Record<ToastType, { accent: string; icon: string; bar: string }> = {
  success: { accent: "border-l-[#0D9488]", icon: "bg-[#0D9488]", bar: "bg-[#0D9488]" },
  error: { accent: "border-l-red-500", icon: "bg-red-500", bar: "bg-red-500" },
  info: { accent: "border-l-sky-500", icon: "bg-sky-500", bar: "bg-sky-500" },
};

// 토스트 종류별 아이콘 경로
const TOAST_ICON_PATHS: Record<ToastType, string> = {
  success: "M5 13l4 4L19 7",
  error: "M12 8v5m0 3h.01",
  info: "M12 11v5m0-8h.01",
};

// 화면 오른쪽 위(모바일은 상단 가운데)에 쌓이는 토스트 목록
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);

  // 새로고침 직전에 예약된 토스트 표시
  useEffect(() => {
    flushPendingToast();
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed top-[84px] inset-x-4 sm:inset-x-auto sm:right-5 sm:w-96 z-[100] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`feely-toast pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${style.accent} bg-white/95 dark:bg-gray-800/95 backdrop-blur px-4 py-3.5 shadow-lg`}
          >
            <span className={`mt-0.5 w-5 h-5 rounded-full ${style.icon} text-white flex items-center justify-center shrink-0`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={TOAST_ICON_PATHS[toast.type]} />
              </svg>
            </span>

            <p className="flex-1 text-sm leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-line break-keep">
              {toast.message}
            </p>

            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="알림 닫기"
              className="-mr-1 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {/* 자동 닫힘까지 남은 시간 표시 */}
            <span
              className={`feely-toast-bar absolute left-0 bottom-0 h-0.5 w-full origin-left ${style.bar} opacity-60`}
              style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
            />
          </div>
        );
      })}
    </div>
  );
}
