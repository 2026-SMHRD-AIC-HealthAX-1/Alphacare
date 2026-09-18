package com.Feely.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
import com.Feely.entity.MemberEntity;
import com.Feely.service.CounselService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
public class CounselController {

    private final CounselService counselService;

    public CounselController(CounselService counselService) {
        this.counselService = counselService;
    }

    @PostMapping("/counsel")
    public Map<String, Boolean> saveCounsel(@RequestBody CounselRequestDTO dto, HttpSession session) {

        Map<String, Boolean> counselFlag = new HashMap<>();

        // 프론트엔드에서 받아온 상담 결과를 DB에 저장하는 메소드
        // try-catch 로 성공, 실패에 따라 counselFlag = true/false 값 반환
        try {
            MemberEntity member = (MemberEntity) session.getAttribute("member");

            System.out.println("세션 member : " + member);

            System.out.println("상담 세션 ID : " + session.getId());
            System.out.println("상담 세션 member : "
                    + session.getAttribute("member"));

            if (member == null) {
                System.out.println("세션에 회원 정보가 없습니다.");

                counselFlag.put("counselFlag", false);
                return counselFlag;
            }

            Long memberNo = member.getMemberNo();

            System.out.println("세션 memberNo : " + memberNo);

            counselService.saveCounsel(dto, memberNo);

            counselFlag.put("counselFlag", true);
        } catch (Exception e) {
            e.printStackTrace();
            counselFlag.put("counselFlag", false);
        }

        return counselFlag;
    }

    @GetMapping("/counsel")
    public List<CounselResponseDTO> sendCounsel(
            HttpSession session) {

        MemberEntity member = (MemberEntity) session.getAttribute("member");

        return counselService.sendCounsel(member.getMemberNo());
    }

}
