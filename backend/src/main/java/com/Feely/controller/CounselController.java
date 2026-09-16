package com.Feely.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.dto.CounselRequestDTO;
import com.Feely.service.CounselService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController 
@RequestMapping ("/api")
public class CounselController {

    private final CounselService counselService;

    public CounselController(CounselService counselService){
        this.counselService = counselService;
    }

    @PostMapping("/counsel")
    public void saveCounsel(@RequestBody CounselRequestDTO dto) {
        counselService.save(dto);
    }
    

}
