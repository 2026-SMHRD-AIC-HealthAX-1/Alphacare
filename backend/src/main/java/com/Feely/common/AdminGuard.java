package com.Feely.common;

import com.Feely.dto.MemberSessionDto;
import com.Feely.repository.MemberRepository;

import jakarta.servlet.http.HttpSession;

// 관리자 권한 확인 - 세션에 캐시된 role이 아니라 DB의 현재 role을 확인 (관리자 페이지에서 역할을 바꾸면 재로그인 없이 바로 반영됨)
public final class AdminGuard {

    private AdminGuard() {
    }

    public static boolean isAdmin(HttpSession session, MemberRepository memberRepository) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");
        if (member == null) {
            return false;
        }
        return memberRepository.findById(member.getMemberNo())
                .map(m -> "ADMIN".equals(m.getRole()))
                .orElse(false);
    }
}
