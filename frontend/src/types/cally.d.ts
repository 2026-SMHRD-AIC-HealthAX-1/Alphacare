// cally 캘린더 커스텀 엘리먼트 JSX 타입 등록
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import "cally";

type CallyElementProps<T extends keyof HTMLElementTagNameMap> = DetailedHTMLProps<
  HTMLAttributes<HTMLElementTagNameMap[T]>,
  HTMLElementTagNameMap[T]
> & {
  // class 속성 허용
  class?: string;
};

// React 19는 react 모듈의 JSX 네임스페이스에 보강
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "calendar-date": CallyElementProps<"calendar-date">;
      "calendar-month": CallyElementProps<"calendar-month">;
      "calendar-range": CallyElementProps<"calendar-range">;
    }
  }
}

export {};
