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
    public Map<String, Boolean> saveCounsel(
        @RequestPart ("data") CounselRequestDTO dto,
        @RequestPart ("startImage") MultipartFile startImage,
        @RequestPart ("endImage") MultipartFile endImage,
        HttpSession session) {

            Map<String, Boolean> counselFlag = new HashMap<>();

            try {
                MemberEntity member = (MemberEntity)session.getAttribute("member");

                System.out.println("세션 member : " + member);
                System.out.println("상담 세션 ID : " + session.getId());

                if (member == null) {
                    System.out.println(CounselResponse.Message.COUNESL_SESSION_NOT_FOUND);
                    counselFlag.put("counselFlag", false);
                    return counselFlag;
                }

                Long memberNo = member.getMemberNo();

                counselService.saveCounsel(dto, memberNo, startImage, endImage);

                counselFlag.put("counselFlag", true);
                
            } catch (Exception e) {
                e.printStackTrace();
                counselFlag.put("counselFlag", false);
            }

            return counselFlag;

        }
        
    @GetMapping("/counsel")
    public ResponseEntity<List<CounselResponseDTO>> sendCounsel(HttpSession session) {
        MemberEntity member = (MemberEntity) session.getAttribute("member");

        if (member == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(counselService.sendCounsel(member.getMemberNo()));
    }

}
