package com.Feely.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.dto.MemberSessionDto;
import com.Feely.dto.MemberSummaryDto;
import com.Feely.dto.MemberUpdateDto;
import com.Feely.entity.MemberEntity;
import com.Feely.repository.MemberRepository;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

// 관리자 전용 기능 (역할 확인, 회원 목록, 서버 상태)
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MemberRepository memberRepository;

    public AdminController(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // 현재 세션 회원의 역할 조회 (관리자 페이지 접근 판단용, 비로그인은 GUEST)
    // 세션 캐시가 아니라 DB에서 바로 조회 - 관리자가 방금 역할을 바꿨어도 재로그인 없이 반영됨
    @GetMapping("/role")
    public ResponseEntity<Map<String, String>> myRole(HttpSession session) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");
        if (member == null) {
            return ResponseEntity.ok(Map.of("role", "GUEST"));
        }
        String role = memberRepository.findById(member.getMemberNo())
                .map(com.Feely.entity.MemberEntity::getRole)
                .orElse("GUEST");
        return ResponseEntity.ok(Map.of("role", role));
    }

    // 회원 목록 조회 (관리자 전용)
    @GetMapping("/members")
    public ResponseEntity<List<MemberSummaryDto>> members(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        List<MemberSummaryDto> result = memberRepository.findAll().stream()
                .map(m -> new MemberSummaryDto(m.getMemberNo(), m.getId(), m.getName(), m.getPhone(), m.getRole(), m.getMileage()))
                .toList();
        return ResponseEntity.ok(result);
    }

    // 회원 정보 수정 (관리자 전용 - 역할/마일리지만 변경, 개인정보는 본인만 수정 가능하도록 남겨둠)
    @PutMapping("/members/{memberNo}")
    public ResponseEntity<MemberSummaryDto> updateMember(@PathVariable Long memberNo,
            @RequestBody MemberUpdateDto request, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        MemberEntity member = memberRepository.findById(memberNo).orElse(null);
        if (member == null) {
            return ResponseEntity.status(404).build();
        }

        if (request.role() != null && !request.role().isBlank()) {
            member.setRole(request.role());
        }
        if (request.mileage() != null && request.mileage() >= 0) {
            member.setMileage(request.mileage());
        }

        MemberEntity updated = memberRepository.save(member);
        return ResponseEntity.ok(new MemberSummaryDto(updated.getMemberNo(), updated.getId(), updated.getName(),
                updated.getPhone(), updated.getRole(), updated.getMileage()));
    }

    // 백엔드 / DB 상태 조회 (관리자 대시보드 상단 위젯용)
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        boolean dbUp;
        try {
            memberRepository.count();
            dbUp = true;
        } catch (Exception e) {
            dbUp = false;
        }
        return ResponseEntity.ok(Map.of("backendUp", true, "dbUp", dbUp));
    }

    private boolean isAdmin(HttpSession session) {
        return com.Feely.common.AdminGuard.isAdmin(session, memberRepository);
    }
}
