package com.Feely.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.Feely.common.CounselResponse;
import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
import com.Feely.dto.MemberSessionDto;
import com.Feely.service.CounselService;
import com.Feely.service.MemberService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
public class CounselController {

    private final CounselService counselService;
    private final MemberService memberService;

    public CounselController(CounselService counselService, MemberService memberService) {
        this.counselService = counselService;
        this.memberService = memberService;
    }

    @PostMapping("/counsel")
    public Map<String, Boolean> saveCounsel(
        @RequestPart ("data") CounselRequestDTO dto,
        // 카메라를 안 쓴 상담은 시작/종료 이미지가 없어서 이 파트 자체가 안 옴 - required=false로
        // 안 바꾸면 Spring이 컨트롤러 진입 전에 400(MissingServletRequestPartException)부터 던짐
        @RequestPart (value = "startImage", required = false) MultipartFile startImage,
        @RequestPart (value = "endImage", required = false) MultipartFile endImage,
        HttpSession session) {

            Map<String, Boolean> counselFlag = new HashMap<>();

            try {
                MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");

                System.out.println("세션 member : " + member);
                System.out.println("상담 세션 ID : " + session.getId());

                if (member == null) {
                    System.out.println(CounselResponse.Message.COUNESL_SESSION_NOT_FOUND);
                    counselFlag.put("counselFlag", false);
                    return counselFlag;
                }

                Long memberNo = member.getMemberNo();

                counselService.saveCounsel(dto, memberNo, startImage, endImage);
                
                // 마일리지 누적
                memberService.setMileage(memberNo);

                counselFlag.put("counselFlag", true);
                

            } catch (Exception e) {
                e.printStackTrace();
                counselFlag.put("counselFlag", false);
            }

            return counselFlag;

        }
        
    @GetMapping("/counsel")
    public ResponseEntity<List<CounselResponseDTO>> sendCounsel(HttpSession session) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");

        if (member == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(counselService.sendCounsel(member.getMemberNo()));
    }

}
