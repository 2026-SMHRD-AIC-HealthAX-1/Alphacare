// cally 캘린더 커스텀 엘리먼트(calendar-date, calendar-month, calendar-range)를
// JSX에서 <calendar-date> 형태로 사용할 수 있도록 타입 보강
// (cally 패키지 자체는 HTMLElementTagNameMap만 선언하고 있어서, React의 JSX.IntrinsicElements에는
//  별도로 등록해줘야 "Property 'calendar-date' does not exist on type 'JSX.IntrinsicElements'" 에러가 안 뜸)
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import "cally";

type CallyElementProps<T extends keyof HTMLElementTagNameMap> = DetailedHTMLProps<
  HTMLAttributes<HTMLElementTagNameMap[T]>,
  HTMLElementTagNameMap[T]
> & {
  // cally 예제 마크업이 className 대신 class 속성을 사용하므로 함께 허용
  class?: string;
};

// React 19(@types/react 19)부터는 JSX.IntrinsicElements가 전역이 아니라
// "react" 모듈 안의 JSX 네임스페이스에 있어서, declare global이 아니라
// declare module "react"로 보강해야 실제로 적용됨
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
