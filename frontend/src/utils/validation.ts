// 비밀번호/휴대폰번호 검증 규칙 (회원가입, 회원정보수정 공용)

// 영문, 숫자, 특수문자를 각각 최소 1개 포함한 8자리 이상
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;

// "010"으로 시작하는 11자리 숫자
export const PHONE_REGEX = /^010\d{8}$/;

export const isValidPassword = (pw: string) => PASSWORD_REGEX.test(pw);
export const isValidPhone = (phone: string) => PHONE_REGEX.test(phone);

// 휴대폰번호 입력값을 숫자 11자리로 정리
export const sanitizePhoneInput = (value: string) => value.replace(/[^0-9]/g, "").slice(0, 11);
