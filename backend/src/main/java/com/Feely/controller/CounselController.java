package com.Feely.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.Feely.common.CounselResponse;
import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
import com.Feely.dto.MemberSessionDto;
import com.Feely.dto.WeeklySummaryDto;
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
    public ResponseEntity<Map<String, Boolean>> saveCounsel(
        @RequestPart ("data") CounselRequestDTO dto,
        // 카메라 미사용 상담은 이미지 파트가 없으므로 선택값
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
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(counselFlag);
                }

                Long memberNo = member.getMemberNo();

                // 새로 저장된 경우에만 마일리지 누적 (이미 저장된 상담이면 성공으로 응답)
                if (counselService.saveCounsel(dto, memberNo, startImage, endImage)) {
                    memberService.setMileage(memberNo);
                }

                counselFlag.put("counselFlag", true);
                

            } catch (Exception e) {
                e.printStackTrace();
                counselFlag.put("counselFlag", false);
            }

            return ResponseEntity.ok(counselFlag);

        }
        
    @GetMapping("/counsel")
    public ResponseEntity<List<CounselResponseDTO>> sendCounsel(HttpSession session) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");

        if (member == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(counselService.sendCounsel(member.getMemberNo()));
    }

    // 저장된 주간 감정 요약 조회 (없거나 그 사이 상담이 늘었으면 204로 응답 -> 프론트가 새로 생성)
    @GetMapping("/counsel/weekly-summary")
    public ResponseEntity<WeeklySummaryDto> getWeeklySummary(
            @RequestParam("weekStart") String weekStart,
            @RequestParam("counselCount") int counselCount,
            HttpSession session) {

        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");
        if (member == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        WeeklySummaryDto result = counselService.getWeeklySummary(
                member.getMemberNo(), LocalDate.parse(weekStart), counselCount);

        return result != null ? ResponseEntity.ok(result) : ResponseEntity.noContent().build();
    }

    // 주간 감정 요약 저장 (같은 주 기록이 있으면 갱신)
    @PostMapping("/counsel/weekly-summary")
    public ResponseEntity<Void> saveWeeklySummary(@RequestBody WeeklySummaryDto dto, HttpSession session) {
        MemberSessionDto member = (MemberSessionDto) session.getAttribute("member");
        if (member == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        counselService.saveWeeklySummary(
                member.getMemberNo(), LocalDate.parse(dto.weekStart()), dto.summary(), dto.counselCount());

        return ResponseEntity.ok().build();
    }

}
