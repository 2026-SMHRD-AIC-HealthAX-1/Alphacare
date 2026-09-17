package com.Feely.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
import com.Feely.service.CounselService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;



@RestController 
@RequestMapping ("/api")
public class CounselController {

    private final CounselService counselService;

    public CounselController(CounselService counselService){
        this.counselService = counselService;
    }

    @PostMapping("/counsel")
    public Map<String, Boolean> saveCounsel(@RequestBody CounselRequestDTO dto) {
        Map<String, Boolean> counselFlag = new HashMap<>();
        
        // 프론트엔드에서 받아온 상담 결과를 DB에 저장하는 메소드
        // try-catch 로 성공, 실패에 따라 counselFlag = true/false 값 반환
        try{
            counselService.saveCounsel(dto);
            counselFlag.put("counselFlag", true);    
        }
        catch(Exception e){
            counselFlag.put("counselFlag", false);
        }

        // System.out.println(counselFlag);
        return counselFlag;
    }
    

    @GetMapping("/counsel/{memberNo}")
    public List<CounselResponseDTO> sendCounsel(
        @PathVariable Long memberNo) {
        return counselService.sendCounsel(memberNo);
    }
    

}
