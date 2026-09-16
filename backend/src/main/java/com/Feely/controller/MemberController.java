package com.Feely.controller;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.dto.MemberDto;
import com.Feely.entity.MemberEntity;
import com.Feely.repository.MemberRepository;


@RestController 
@RequestMapping("/api")
public class MemberController{

    private final MemberRepository repo;

    public MemberController(MemberRepository repo) {
        this.repo = repo;
    }

    // 회원가입
    @PostMapping("/signUp")
    public ResponseEntity<String> memberJoin(@RequestBody MemberDto request) {
        if (isBlank(request.id()) || isBlank(request.password())
                || isBlank(request.name()) || isBlank(request.phone())) {
            return ResponseEntity.badRequest().body("필수 회원정보가 누락되었습니다.");
        }

        if (repo.existsByMemberId(request.id())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 사용중인 아이디입니다.");
        }

        MemberEntity member = new MemberEntity();
        member.setId(request.id().trim());
        member.setPw(request.password());
        member.setName(request.name().trim());
        member.setPhone(request.phone().trim());
        member.setSns(blankToNull(request.kakaoId()));
        member.setRole("USER");
        member.setMileage(0);

        try {
            repo.save(member);
            return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 등록된 회원정보가 있습니다.");
        }
    }

    // 로그인
    @PostMapping("/member/login")
    public ResponseEntity<MemberDto> memberLogin(
            @RequestBody MemberDto request, HttpSession session) {
        if (isBlank(request.id()) || isBlank(request.password())) {
            return ResponseEntity.badRequest().body(MemberDto.loginResult(false, null));
        }

        MemberEntity member = repo.findMemberById(request.id().trim()).orElse(null);
        if (member == null || !member.getPw().equals(request.password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MemberDto.loginResult(false, null));
        }

        // 로그인 성공 회원을 세션에 저장해 이후 요청에서 사용할 수 있도록 함
        session.setAttribute("member", member);
        return ResponseEntity.ok(MemberDto.loginResult(true, member.getMemberNo()));
    }

    // 아이디 중복 여부 확인
    @GetMapping("/member/checkid")
    public ResponseEntity<MemberDto> memberDup(@RequestParam("id") String id) {
        System.out.println(" memberDup in~~");
        return ResponseEntity.ok(MemberDto.duplicateResult(repo.existsByMemberId(id)));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}




