// 토스트 알림 저장소 (alert 대신 사용, 5초 뒤 자동으로 닫힘)
export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// 자동으로 닫히기까지 걸리는 시간
export const TOAST_DURATION_MS = 5000;

// 새로고침 이후에 보여줄 토스트 저장 키
const PENDING_TOAST_KEY = "feely_pending_toast";

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

// 구독 중인 Toaster 컴포넌트에 변경 알림
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToasts = () => toasts;

// 토스트 닫기
export const dismissToast = (id: number) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

// 토스트 띄우기 (기본은 오류 표시)
export const showToast = (message: string, type: ToastType = "error") => {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
};

// 페이지를 새로 불러오는 이동(location.href) 직전에 호출 - 이동한 페이지에서 토스트를 띄움
export const showToastAfterReload = (message: string, type: ToastType = "success") => {
  try {
    sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, type }));
  } catch {
    // 저장소를 못 쓰는 환경이면 토스트 없이 이동
  }
};

// 새로고침 전에 예약된 토스트가 있으면 꺼내서 띄움
export const flushPendingToast = () => {
  try {
    const saved = sessionStorage.getItem(PENDING_TOAST_KEY);
    if (!saved) return;
    sessionStorage.removeItem(PENDING_TOAST_KEY);
    const { message, type } = JSON.parse(saved) as { message: string; type: ToastType };
    showToast(message, type);
  } catch {
    // 저장소 오류는 무시
  }
};
