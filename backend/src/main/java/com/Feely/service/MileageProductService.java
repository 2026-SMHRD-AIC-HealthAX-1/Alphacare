package com.Feely.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.Feely.common.MemberResponse;
import com.Feely.common.MileageProductResponse;
import com.Feely.dto.MileageProductDto;
import com.Feely.entity.MemberEntity;
import com.Feely.entity.MileageHistoryEntity;
import com.Feely.entity.MileageProductEntity;
import com.Feely.repository.MemberRepository;
import com.Feely.repository.MileageHistoryRepository;
import com.Feely.repository.MileageProductRepository;

import jakarta.transaction.Transactional;

@Service
public class MileageProductService {

    private final MileageProductRepository mileageProductRepository;
    private final MemberRepository memberRepository;
    private final MileageHistoryRepository mileageHistoryRepository;

    // 생성자 주입
    public MileageProductService(MileageProductRepository mileageProductRepository, MemberRepository memberRepository,
            MileageHistoryRepository mileageHistoryRepository) {
        this.mileageProductRepository = mileageProductRepository;
        this.memberRepository = memberRepository;
        this.mileageHistoryRepository = mileageHistoryRepository;
    }

    // 상품 전체 조회
    public List<MileageProductDto> getProducts() {
        List<MileageProductEntity> products = mileageProductRepository.findAll();

        return products.stream()
                .map(product -> MileageProductDto.detailResult(
                    product.getProdNo(),
                    product.getProdName(), 
                    product.getProdInventory(), 
                    product.getProdPrice(), 
                    product.getProdImage(), 
                    MileageProductResponse.Message.PRODUCT_LIST_SUCCESS,
                    true
                )).toList();
    }

    // 상품 단일 조회
    public MileageProductDto getProduct(Long id) {
        Optional<MileageProductEntity> product = mileageProductRepository.findById(id);
        if (product.isEmpty()) {
            return MileageProductDto.detailResult(null, null, null, null, null,
                    MileageProductResponse.Message.PRODUCT_NOT_FOUND, false);
        }

        MileageProductEntity entity = product.get();
        return MileageProductDto.detailResult(entity.getProdNo(), entity.getProdName(),
                entity.getProdInventory(), entity.getProdPrice(), entity.getProdImage(),
                MileageProductResponse.Message.PRODUCT_LIST_SUCCESS, true);
    }

    // 상품 등록
    public MileageProductDto createProduct(MileageProductEntity request) {
        if (request == null || isBlank(request.getProdName())) {
            return MileageProductDto.saveResult(false, MileageProductResponse.Message.PRODUCT_NAME_REQUIRED);
        }
        if (request.getProdPrice() < 0) {
            return MileageProductDto.saveResult(false, MileageProductResponse.Message.PRODUCT_PRICE_REQUIRED);
        }

        MileageProductEntity saved = mileageProductRepository.save(request);
        return MileageProductDto.detailResult(saved.getProdNo(), saved.getProdName(),
                saved.getProdInventory(), saved.getProdPrice(), saved.getProdImage(),
                MileageProductResponse.Message.PRODUCT_REGISTRATION_SUCCESS, true);
    }

    // 상품 수정 (요청에 없는 값은 기존값 유지)
    public MileageProductDto updateProduct(Long id, MileageProductDto request) {
        Optional<MileageProductEntity> existing = mileageProductRepository.findById(id);
        if (existing.isEmpty()) {
            return MileageProductDto.updateResult(false, MileageProductResponse.Message.PRODUCT_NOT_FOUND);
        }

        MileageProductEntity product = existing.get();

        if (!isBlank(request.prodName())) {
            product.setProdName(request.prodName());
        }
        if (request.prodInventory() != null && request.prodInventory() >= 0) {
            product.setProdInventory(request.prodInventory());
        }
        if (request.prodPrice() != null && request.prodPrice() >= 0) {
            product.setProdPrice(request.prodPrice());
        }
        if (request.prodImage() != null && request.prodImage().length > 0) {
            product.setProdImage(request.prodImage());
        }

        MileageProductEntity updated = mileageProductRepository.save(product);
        return MileageProductDto.detailResult(updated.getProdNo(), updated.getProdName(),
                updated.getProdInventory(), updated.getProdPrice(), updated.getProdImage(),
                MileageProductResponse.Message.PRODUCT_UPDATE_SUCCESS, true);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Transactional 
    public MileageProductDto exchangeProduct(Long prodNo, Long memberNo){

        // 1. 상품 번호로 상품 조회 (동시 교환 요청 시 재고가 음수가 되지 않도록 행 잠금)
        MileageProductEntity product = mileageProductRepository.findByIdForUpdate(prodNo).orElseThrow(() -> new IllegalArgumentException(MileageProductResponse.Message.PRODUCT_NOT_FOUND));

        // 2. 회원 번호로 회원 조회 (동시 교환 요청 시 마일리지가 중복 차감되지 않도록 행 잠금)
        MemberEntity member = memberRepository.findByIdForUpdate(memberNo).orElseThrow(() -> new IllegalArgumentException(MemberResponse.Message.MEMBER_NOT_FOUND));

        // 3. 상품 재고 확인
        if (product.getProdInventory() <= 0){
            throw new IllegalArgumentException(MileageProductResponse.Message.PRODUCT_OUT_OF_INVENTORY);
        }

        // 4. 회원 마일리지 확인
        if (member.getMileage() < product.getProdPrice()){
            throw new IllegalArgumentException(MemberResponse.Message.MEMBER_NOT_ENOUGH_MILEAGE);
        }

        // 5. 마일리지 차감
        member.setMileage(member.getMileage() - product.getProdPrice());

        // 6. 상품 재고 차감
        product.setProdInventory(product.getProdInventory() - 1);

        // DB 저장
        memberRepository.save(member);
        mileageProductRepository.save(product);

        // 7. 마일리지 사용 내역 기록
        mileageHistoryRepository.save(new MileageHistoryEntity(
                null, member, "USE", -product.getProdPrice(), product.getProdName(), LocalDateTime.now()));

        return MileageProductDto.exchangeResult(true, MileageProductResponse.Message.PRODUCT_EXCHANGE_SUCCESS, member.getMileage());
    }
}
