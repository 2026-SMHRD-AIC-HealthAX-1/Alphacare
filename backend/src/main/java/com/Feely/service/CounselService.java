package com.Feely.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
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

    // 프론트에서 넘어온 값 Counsel DB에 저장하는 메소드
    public void saveCounsel(CounselRequestDTO dto) {

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


    // DB에 저장된 값을 회원번호로 조회하여 프론트엔드로 넘기는 메소드
    public List<CounselResponseDTO> sendCounsel(Long memberNo){

        // 회원 번호로 상담 목록 조회
        List<CounselEntity> counselList =
            counselRepository.findByMember_MemberNo(memberNo);

        // Entity 목록을 ReponseDTO 목록에 넣어주기
        List<CounselResponseDTO> responseList = new ArrayList<>();

        for(CounselEntity counsel : counselList){
            CounselResponseDTO response = new CounselResponseDTO();

            response.setCounselNo(counsel.getCounselNo());
            response.setMemberNo(counsel.getMember().getMemberNo());

            response.setCounselSum(counsel.getCounselSum());

            response.setE01Rate(counsel.getE01Rate());
            response.setE02Rate(counsel.getE02Rate());
            response.setE03Rate(counsel.getE03Rate());
            response.setE04Rate(counsel.getE04Rate());
            response.setE05Rate(counsel.getE05Rate());
            response.setE06Rate(counsel.getE06Rate());

            response.setCounselDttm(counsel.getCounselDttm());
            response.setStartImgPath(counsel.getStartImagePath());
            response.setEndImgPath(counsel.getEndImagePath());

            responseList.add(response);
        }

        return responseList;
    }

}
