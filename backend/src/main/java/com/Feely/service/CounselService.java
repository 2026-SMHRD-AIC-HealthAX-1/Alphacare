package com.Feely.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.Feely.dto.CounselRequestDTO;
import com.Feely.entity.CounselEntity;
import com.Feely.entity.MemberEntity;
import com.Feely.repository.CounselRepository;
import com.Feely.repository.MemberRepository;

@Service 
public class CounselService {
    private final CounselRepository counselRepository;
    private final MemberRepository memberRepository;

    public CounselService(
        CounselRepository counselRepository,
        MemberRepository memberRepository){

        this.counselRepository = counselRepository;
        this.memberRepository = memberRepository;

    }

    public void save(CounselRequestDTO dto) {

        // userId로 회원 Entity 조회
        MemberEntity member = memberRepository
                .findById(dto.getUserId())
                .orElseThrow(() ->
                        new IllegalArgumentException("회원을 찾을 수 없습니다.")
                );

        CounselEntity entity = new CounselEntity();
        
        entity.setMember(member);
        entity.setCounselDttm(dto.getCounselDate());
        entity.setCounselSum(dto.getSummary());
        entity.setStartImagePath("test");
        entity.setEndImagePath("test");
        entity.setE01Rate(BigDecimal.valueOf(dto.getEmotionScore())); // 테이블에 DECIMAL 데이터 타입으로 저장해야하므로 형변환해주기
        entity.setE02Rate(BigDecimal.valueOf(dto.getEmotionScore()));
        entity.setE03Rate(BigDecimal.valueOf(dto.getEmotionScore()));
        entity.setE04Rate(BigDecimal.valueOf(dto.getEmotionScore()));
        entity.setE05Rate(BigDecimal.valueOf(dto.getEmotionScore()));
        entity.setE06Rate(BigDecimal.valueOf(dto.getEmotionScore()));

        counselRepository.save(entity);
    }
}
