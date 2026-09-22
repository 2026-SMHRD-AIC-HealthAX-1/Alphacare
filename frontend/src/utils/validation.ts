// 회원가입(SignupPage)과 마이페이지 회원정보수정(MyPage)에서 같이 쓰는 비밀번호/휴대폰번호 검증 규칙
// - 두 페이지의 규칙이 서로 어긋나지 않도록 이 파일 하나로 관리함

// 영문, 숫자, 특수문자를 각각 최소 1개 포함한 8자리 이상
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

// "010"으로 시작하는 11자리 숫자
export const PHONE_REGEX = /^010\d{8}$/;

export const isValidPassword = (pw: string) => PASSWORD_REGEX.test(pw);
export const isValidPhone = (phone: string) => PHONE_REGEX.test(phone);

// 휴대폰번호 입력값에서 숫자가 아닌 문자를 제거하고 11자리까지만 허용 (SignupPage의 checkphone과 동일)
export const sanitizePhoneInput = (value: string) => value.replace(/[^0-9]/g, "").slice(0, 11);
