package com.Feely.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.Feely.common.MemberResponse;
import com.Feely.dto.KakaoLoginResponse;
import com.Feely.dto.KakaoSignupRequest;
import com.Feely.dto.MemberDto;
import com.Feely.dto.MileageHistoryDto;
import com.Feely.dto.MemberSessionDto;
import com.Feely.entity.MemberEntity;
import com.Feely.entity.MileageHistoryEntity;
import com.Feely.repository.MemberRepository;
import com.Feely.repository.MileageHistoryRepository;
import com.Feely.util.PasswordUtil;

import com.Feely.repository.CounselRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.servlet.http.HttpSession;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final CounselRepository counselRepository;
    private final MileageHistoryRepository mileageHistoryRepository;
    private final KakaoAuthService kakaoAuthService;

    public MemberService(MemberRepository memberRepository, CounselRepository counselRepository,
            MileageHistoryRepository mileageHistoryRepository, KakaoAuthService kakaoAuthService) {
        this.memberRepository = memberRepository;
        this.counselRepository = counselRepository;
        this.mileageHistoryRepository = mileageHistoryRepository;
        this.kakaoAuthService = kakaoAuthService;
    }

    // 회원가입
    public MemberDto signup(MemberDto request) {
        if (isBlank(request.id()) || isBlank(request.password())
                || isBlank(request.name()) || isBlank(request.phone())) {
            return MemberDto.signupResult(false, MemberResponse.Message.REQUIRED_MEMBER_INFO);
        }

        if (memberRepository.existsByMemberId(request.id())) {
            return MemberDto.signupResult(false, MemberResponse.Message.DUPLICATE_ID);
        }

        if (memberRepository.existsByPhone(request.phone().trim())) {
            return MemberDto.signupResult(false, MemberResponse.Message.DUPLICATE_PHONE);
        }

        MemberEntity member = new MemberEntity();
        member.setId(request.id().trim());
        member.setPw(PasswordUtil.sha256(request.password()));
        member.setName(request.name().trim());
        member.setPhone(request.phone().trim());
        member.setSns(blankToNull(request.kakaoId()));
        member.setRole("USER");
        member.setMileage(0);

        try {
            memberRepository.save(member);
            return MemberDto.signupResult(true, MemberResponse.Message.SIGNUP_SUCCESS);
        } catch (DataIntegrityViolationException e) {
            return MemberDto.signupResult(false, MemberResponse.Message.DUPLICATE_MEMBER_INFO);
        }
    }

    // 로그인
    public MemberDto login(MemberDto request, HttpSession session) {
        if (isBlank(request.id()) || isBlank(request.password())) {
            return MemberDto.loginResult(false, MemberResponse.Message.LOGIN_REQUIRED_INPUT,null);
        }

        MemberEntity member = memberRepository.findMemberById(request.id().trim()).orElse(null);
        String hashedPassword = PasswordUtil.sha256(request.password());
        boolean passwordMatches = member != null && (member.getPw().equals(hashedPassword) );

        if (member == null || !passwordMatches) {
            return MemberDto.loginResult(false, MemberResponse.Message.LOGIN_FAIL,null);
        }

        session.setAttribute("member", toSessionDto(member));
        return MemberDto.loginResult(true, MemberResponse.Message.LOGIN_SUCCESS, member.getMileage());
    }

    // 카카오 로그인: 인가코드로 카카오 사용자 정보를 조회한 뒤, 기존 회원이면 로그인, 아니면 추가정보 입력 요청
    public KakaoLoginResponse kakaoLogin(String code, HttpSession session) {
        KakaoAuthService.KakaoUserInfo userInfo = kakaoAuthService.getUserInfo(code);
        if (userInfo == null) {
            return new KakaoLoginResponse("ERROR", null, null, false, null, MemberResponse.Message.KAKAO_AUTH_FAILED);
        }

        MemberEntity member = memberRepository.findMemberBySns(userInfo.kakaoId()).orElse(null);
        if (member == null) {
            return new KakaoLoginResponse("NEED_SIGNUP", userInfo.kakaoId(), userInfo.nickname(), false, null,
                    MemberResponse.Message.KAKAO_NEED_SIGNUP);
        }

        session.setAttribute("member", toSessionDto(member));
        return new KakaoLoginResponse("LOGIN", userInfo.kakaoId(), member.getName(), true, member.getMileage(),
                MemberResponse.Message.LOGIN_SUCCESS);
    }

    // 카카오 최초 가입: 추가 입력받은 전화번호로 회원을 생성하고 바로 로그인 처리
    public KakaoLoginResponse kakaoSignup(KakaoSignupRequest request, HttpSession session) {
        if (isBlank(request.kakaoId()) || isBlank(request.phone())) {
            return new KakaoLoginResponse("ERROR", request.kakaoId(), request.nickname(), false, null,
                    MemberResponse.Message.REQUIRED_MEMBER_INFO);
        }

        // 이미 연동된 카카오 계정이면 새로 만들지 않고 바로 로그인 처리 (중복 클릭 대비)
        MemberEntity existing = memberRepository.findMemberBySns(request.kakaoId()).orElse(null);
        if (existing != null) {
            session.setAttribute("member", toSessionDto(existing));
            return new KakaoLoginResponse("LOGIN", request.kakaoId(), existing.getName(), true, existing.getMileage(),
                    MemberResponse.Message.LOGIN_SUCCESS);
        }

        String phone = request.phone().trim();
        if (memberRepository.existsByPhone(phone)) {
            return new KakaoLoginResponse("ERROR", request.kakaoId(), request.nickname(), false, null,
                    MemberResponse.Message.DUPLICATE_PHONE);
        }

        MemberEntity member = new MemberEntity();
        member.setId("kakao_" + request.kakaoId());
        member.setPw(PasswordUtil.sha256(PasswordUtil.generateRandomPassword()));
        member.setName(isBlank(request.nickname()) ? "카카오회원" : request.nickname().trim());
        member.setPhone(phone);
        member.setSns(request.kakaoId());
        member.setRole("USER");
        member.setMileage(0);

        memberRepository.save(member);
        session.setAttribute("member", toSessionDto(member));
        return new KakaoLoginResponse("LOGIN", request.kakaoId(), member.getName(), true, member.getMileage(),
                MemberResponse.Message.SIGNUP_SUCCESS);
    }

    // 회원 엔티티 -> 세션에 저장할 DTO 변환 (로그인/카카오로그인/카카오가입 공용)
    private MemberSessionDto toSessionDto(MemberEntity member) {
        return new MemberSessionDto(
                member.getMemberNo(),
                member.getId(),
                member.getName(),
                member.getPhone(),
                member.getSns(),
                member.getRole(),
                member.getMileage()
        );
    }

    // 중복 확인
    public MemberDto duplicateCheck(String id) {
        return MemberDto.duplicateResult(memberRepository.existsByMemberId(id));
    }

    // 아이디 찾기
    public MemberDto findId(String name, String phone) {
        if (isBlank(name) || isBlank(phone)) {
            return MemberDto.FindIdResult(null, MemberResponse.Message.FIND_ID_REQUIRED_INPUT);
        }

        String memberId = memberRepository.findMemberByNameAndPhone(name.trim(), phone.trim())
                .map(MemberEntity::getId)
                .orElse(null);

        String message = memberId != null ? MemberResponse.Message.FIND_ID_SUCCESS : MemberResponse.Message.MEMBER_NOT_FOUND;
        return MemberDto.FindIdResult(memberId, message);
    }

    // 비밀번호 찾기
    public MemberDto findPassword(MemberDto request) {
        if (isBlank(request.id()) || isBlank(request.phone())) {
            return MemberDto.findPasswordResult(false, null, MemberResponse.Message.FIND_PASSWORD_REQUIRED_INPUT);
        }

        MemberEntity member = memberRepository.findMemberByIdAndPhone(request.id().trim(), request.phone().trim()).orElse(null);
        if (member == null) {
            return MemberDto.findPasswordResult(false, null, MemberResponse.Message.MEMBER_NOT_FOUND);
        }

        String temporaryPassword = PasswordUtil.generateRandomPassword();
        member.setPw(PasswordUtil.sha256(temporaryPassword));
        memberRepository.save(member);

        return MemberDto.findPasswordResult(true, temporaryPassword, MemberResponse.Message.TEMP_PASSWORD_SENT);
    }

    // 회원 정보 수정
    public MemberDto updateMember(HttpSession session, MemberDto request) {
        MemberSessionDto sessionMember = (MemberSessionDto) session.getAttribute("member");
        if (sessionMember == null) {
            return MemberDto.updateResult(false, MemberResponse.Message.NEED_LOGIN);
        }

        Long memberNo = sessionMember.getMemberNo();
        if (memberNo == null) {
            return MemberDto.updateResult(false, MemberResponse.Message.NEED_MEMBER_NO);
        }

        MemberEntity member = memberRepository.findById(memberNo).orElse(null);
        if (member == null) {
            return MemberDto.updateResult(false, MemberResponse.Message.MEMBER_INFO_NOT_FOUND);
        }

        if (!isBlank(request.id())) {
            String newId = request.id().trim();
            if (!member.getId().equals(newId) && memberRepository.existsByMemberId(newId)) {
                return MemberDto.updateResult(false, MemberResponse.Message.DUPLICATE_ID);
            }
            member.setId(newId);
        }

        if (!isBlank(request.password())) {
            member.setPw(PasswordUtil.sha256(request.password()));
        }

        if (!isBlank(request.name())) {
            member.setName(request.name().trim());
        }

        if (!isBlank(request.phone())) {
            String newPhone = request.phone().trim();
            if (!member.getPhone().equals(newPhone) && memberRepository.existsByPhone(newPhone)) {
                return MemberDto.updateResult(false, MemberResponse.Message.DUPLICATE_PHONE);
            }
            member.setPhone(newPhone);
        }

        if (request.kakaoId() != null) {
            member.setSns(blankToNull(request.kakaoId()));
        }

        memberRepository.save(member);

        session.setAttribute("member", toSessionDto(member));

        return MemberDto.updateResult(true, MemberResponse.Message.UPDATE_SUCCESS);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    // 보유 마일리지 조회
    public MemberDto getMileage(Long memberNo) {
        return memberRepository.findById(memberNo)
                .map(member -> MemberDto.mileageResult(member.getMileage(), MemberResponse.Message.MILEAGE_SUCCESS))
                .orElseGet(() -> MemberDto.mileageResult(null, MemberResponse.Message.MEMBER_INFO_NOT_FOUND));
    }

    // 마일리지 누적
    public void setMileage(Long memberNo) {

        // 오늘 날짜
        LocalDate today = LocalDate.now();

        // 오늘 00:00:00
        LocalDateTime start = today.atStartOfDay();

        // 내일 00:00:00
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        
        // 오늘 해당 회원의 상담 횟수
        long todayCounselCount = 
            counselRepository.countByMember_MemberNoAndCounselDttmBetween(memberNo, start, end);

        System.out.println("오늘 상담 횟수 : " + todayCounselCount);

        // 상담 저장 이후 1개면 오늘 최초 상담
        if (todayCounselCount == 1) {

            // 회원 조회
            MemberEntity member = memberRepository.findById(memberNo).orElseThrow(() -> new IllegalArgumentException(MemberResponse.Message.MEMBER_NOT_FOUND));

            member.setMileage(member.getMileage() + 1000);

            memberRepository.save(member);

            // 마일리지 적립 내역 기록
            mileageHistoryRepository.save(new MileageHistoryEntity(
                    null, member, "EARN", 1000, "오늘 첫 상담 적립", LocalDateTime.now()));

            System.out.println("1000 마일리지 지급 완료");
        }
    }

    // 마일리지 적립/사용 내역 조회 (최신순)
    public List<MileageHistoryDto> getMileageHistory(Long memberNo) {
        return mileageHistoryRepository.findByMember_MemberNoOrderByCreatedAtDesc(memberNo)
                .stream()
                .map(MileageHistoryDto::from)
                .toList();
    }
}
