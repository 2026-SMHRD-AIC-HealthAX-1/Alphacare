package com.Feely.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.Feely.common.MemberResponse;
import com.Feely.dto.MemberDto;
import com.Feely.dto.MemberSessionDto;
import com.Feely.entity.MemberEntity;
import com.Feely.repository.MemberRepository;
import com.Feely.util.MileageCryptoUtil;
import com.Feely.util.PasswordUtil;

import com.Feely.repository.CounselRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.servlet.http.HttpSession;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final CounselRepository counselRepository;

    public MemberService(MemberRepository memberRepository, CounselRepository counselRepository) {
        this.memberRepository = memberRepository;
        this.counselRepository = counselRepository;
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

        MemberSessionDto sessionMember = new MemberSessionDto(
                member.getMemberNo(),
                member.getId(),
                member.getName(),
                member.getPhone(),
                member.getSns(),
                member.getRole(),
                member.getMileage()
        );

        String encryptedMileage = MileageCryptoUtil.encrypt(member.getMileage());
        session.setAttribute("member", sessionMember);
        session.setAttribute("memberMileage", encryptedMileage);
        return MemberDto.loginResult(true, MemberResponse.Message.LOGIN_SUCCESS, member.getMileage());
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

        return MemberDto.FindIdResult(memberId, MemberResponse.Message.FIND_ID_SUCCESS);
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

        MemberSessionDto updatedSessionMember = new MemberSessionDto(
                member.getMemberNo(),
                member.getId(),
                member.getName(),
                member.getPhone(),
                member.getSns(),
                member.getRole(),
                member.getMileage()
        );

        String encryptedMileage = MileageCryptoUtil.encrypt(member.getMileage());
        session.setAttribute("member", updatedSessionMember);
        session.setAttribute("memberMileage", encryptedMileage);

        return MemberDto.updateResult(true, MemberResponse.Message.UPDATE_SUCCESS);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
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

            System.out.println("1000 마일리지 지급 완료");
        }
    }
}
