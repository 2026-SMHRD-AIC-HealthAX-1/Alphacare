package com.Feely.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.common.MemberResponse;
import com.Feely.dto.KakaoLoginResponse;
import com.Feely.dto.KakaoSignupRequest;
import com.Feely.dto.MemberDto;
import com.Feely.dto.MemberSessionDto;
import com.Feely.dto.MileageHistoryDto;
import com.Feely.service.MemberService;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;


@RestController 
@RequestMapping("/api")
public class MemberController{

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    // 회원가입
    @PostMapping("/member/signup")
    public ResponseEntity<MemberDto> memberJoin(@RequestBody MemberDto request) {

        // 1) 필수 값 검증: 값이 비어 있으면 바로 예외 처리
        if (isBlank(request.id()) || isBlank(request.password())
                || isBlank(request.name()) || isBlank(request.phone())) {
            return ResponseEntity.badRequest()
                    .body(MemberDto.signupResult(false, MemberResponse.Message.REQUIRED_MEMBER_INFO));
        }

        // 2) 검증 통과 후 서비스 호출
        MemberDto result = memberService.signup(request);

        // 3) 서비스 결과에 따라 HTTP 상태 코드 분기
        if (Boolean.TRUE.equals(result.joinFlag())) {
            return ResponseEntity.status(201).body(result);
        }

        // 4) 회원가입 실패 시 상태 코드 분기
        if (MemberResponse.Message.DUPLICATE_ID.equals(result.message())) {
            return ResponseEntity.status(409).body(result);
        }

        // 5) 마지막 반환은 성공 응답으로 정리
        return ResponseEntity.ok(result);
    }

    // 로그인
    @PostMapping("/member/login")
    public ResponseEntity<MemberDto> memberLogin(@RequestBody MemberDto request, HttpSession session) {
        // 1) 로그인 필수 입력값 검증
        if (isBlank(request.id()) || isBlank(request.password())) {
            return ResponseEntity.badRequest()
                    .body(MemberDto.loginResult(false, MemberResponse.Message.LOGIN_REQUIRED_INPUT, null));
        }

        // 2) 검증 통과 후 로그인 서비스 호출
        MemberDto result = memberService.login(request, session);

        // 3) 로그인 성공 여부에 따른 응답 분기
        if (Boolean.TRUE.equals(result.loginFlag())) {
            return ResponseEntity.ok(result);
        }

        // 4) 마지막 반환은 성공 응답으로 정리
        return ResponseEntity.ok(result);
    }

    // 로그아웃
    @PostMapping("/member/logout")
    public ResponseEntity<MemberDto> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(MemberDto.logoutResult(true, MemberResponse.Message.LOGOUT_SUCCESS));
    }

    // 아이디 중복 여부 확인
    @GetMapping("/member/checkid")
    public ResponseEntity<MemberDto> memberDup(@RequestParam("id") String id) {
        // 1) 아이디 값 검증
        if (isBlank(id)) {
            return ResponseEntity.badRequest()
                    .body(MemberDto.duplicateResult(false));
        }

        // 2) 검증 통과 후 중복 체크 서비스 호출
        return ResponseEntity.ok(memberService.duplicateCheck(id));
    }

    // 아이디 찾기 (이름, 전화번호)
    @GetMapping("/member/findId")
    public ResponseEntity<MemberDto> findId(@RequestParam("name") String name, @RequestParam("phone") String phone) {
        // 1) 아이디 찾기 입력값 검증
        if (isBlank(name) || isBlank(phone)) {
            return ResponseEntity.badRequest()
                    .body(MemberDto.FindIdResult(null, MemberResponse.Message.FIND_ID_REQUIRED_INPUT));
        }

        // 2) 검증 통과 후 아이디 찾기 서비스 호출
        MemberDto result = memberService.findId(name, phone);
        
        return ResponseEntity.ok(result);
    }

    // 비밀번호 찾기 (아이디, 전화번호)
    @PostMapping("/member/findPw")
    public ResponseEntity<MemberDto> findPassword(@RequestBody MemberDto request) {
        // 1) 비밀번호 찾기 입력값 검증
        if (isBlank(request.id()) || isBlank(request.phone())) {
            return ResponseEntity.badRequest()
                    .body(MemberDto.findPasswordResult(false, null, MemberResponse.Message.FIND_PASSWORD_REQUIRED_INPUT));
        }

        // 2) 검증 통과 후 비밀번호 찾기 서비스 호출
        MemberDto result = memberService.findPassword(request);

        // 3) 서비스 결과에 따라 응답 분기
        if (Boolean.TRUE.equals(result.joinFlag())) {
            return ResponseEntity.ok(result);
        }

        // 4) 마지막 반환은 성공 응답으로 정리
        return ResponseEntity.ok(result);
    }

    // 회원정보 수정 (회원번호 기준)
    @PutMapping("/member/")
    public ResponseEntity<MemberDto> updateMember(HttpSession session, @RequestBody MemberDto request) {
        // 1) 로그인 여부 검증: 세션 확인 후 비로그인 사용자는 막음
        if (session == null || session.getAttribute("member") == null) {
            return ResponseEntity.status(401)
                    .body(MemberDto.updateResult(false, MemberResponse.Message.NEED_LOGIN));
        }

        // 2) 검증 통과 후 회원 수정 서비스 호출
        MemberDto result = memberService.updateMember(session, request);

        // 3) 서비스 결과에 따라 상태 코드 분기
        if (Boolean.TRUE.equals(result.joinFlag())) {
            return ResponseEntity.ok(result);
        }

        // 4) 회원 정보 수정 실패 시 상태 코드 분기
        if (MemberResponse.Message.NEED_MEMBER_NO.equals(result.message())
                || MemberResponse.Message.MEMBER_INFO_NOT_FOUND.equals(result.message())) {
            return ResponseEntity.status(400).body(result);
        }

        // 5) 아이디 중복 시 상태 코드 분기
        if (MemberResponse.Message.DUPLICATE_ID.equals(result.message())) {
            return ResponseEntity.status(409).body(result);
        }

        // 마지막 반환은 성공 응답으로 정리
        return ResponseEntity.ok(result);
    }

    // 보유 마일리지 조회 (세션 회원 기준)
    @GetMapping("/member/mileage")
    public ResponseEntity<MemberDto> getMileage(HttpSession session) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");
        if (member == null) {
            return ResponseEntity.status(401)
                    .body(MemberDto.mileageResult(null, MemberResponse.Message.NEED_LOGIN));
        }
        return ResponseEntity.ok(memberService.getMileage(member.getMemberNo()));
    }

    // 마일리지 적립/사용 내역 조회 (세션 회원 기준)
    @GetMapping("/member/mileage/history")
    public ResponseEntity<List<MileageHistoryDto>> getMileageHistory(HttpSession session) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");
        if (member == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(memberService.getMileageHistory(member.getMemberNo()));
    }

    // 카카오 로그인: 인가코드를 받아 로그인 처리 (기존 회원이면 로그인, 신규면 추가정보 입력 필요 응답)
    @PostMapping("/member/kakao/login")
    public ResponseEntity<KakaoLoginResponse> kakaoLogin(@RequestBody Map<String, String> body, HttpSession session) {
        String code = body.get("code");
        if (isBlank(code)) {
            return ResponseEntity.badRequest()
                    .body(new KakaoLoginResponse("ERROR", null, null, false, null, MemberResponse.Message.REQUIRED_MEMBER_INFO));
        }
        return ResponseEntity.ok(memberService.kakaoLogin(code, session));
    }

    // 카카오 최초 가입: 추가 입력받은 전화번호로 회원가입 후 바로 로그인 처리
    @PostMapping("/member/kakao/signup")
    public ResponseEntity<KakaoLoginResponse> kakaoSignup(@RequestBody KakaoSignupRequest request, HttpSession session) {
        return ResponseEntity.ok(memberService.kakaoSignup(request, session));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
