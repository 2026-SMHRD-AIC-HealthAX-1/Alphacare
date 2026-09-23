package com.Feely.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.Feely.common.MemberResponse;
import com.Feely.common.MileageProductResponse;
import com.Feely.dto.MileageProductDto;
import com.Feely.entity.MemberEntity;
import com.Feely.entity.MileageProductEntity;
import com.Feely.repository.MemberRepository;
import com.Feely.repository.MileageProductRepository;

import jakarta.transaction.Transactional;

@Service
public class MileageProductService {

    private final MileageProductRepository mileageProductRepository;
    private final MemberRepository memberRepository;

    // 생성자 주입
    public MileageProductService(MileageProductRepository mileageProductRepository, MemberRepository memberRepository) {
        this.mileageProductRepository = mileageProductRepository;
        this.memberRepository = memberRepository;
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
                
        // return MileageProductDto.listResult(true, MileageProductResponse.Message.PRODUCT_LIST_SUCCESS);
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

    // 상품 수정
    public MileageProductDto updateProduct(Long id, MileageProductEntity request) {
        Optional<MileageProductEntity> existing = mileageProductRepository.findById(id);
        if (existing.isEmpty()) {
            return MileageProductDto.updateResult(false, MileageProductResponse.Message.PRODUCT_NOT_FOUND);
        }

        MileageProductEntity product = existing.get();

        if (request.getProdName() != null && !request.getProdName().isBlank()) {
            product.setProdName(request.getProdName());
        }
        if (request.getProdInventory() >= 0) {
            product.setProdInventory(request.getProdInventory());
        }
        if (request.getProdPrice() >= 0) {
            product.setProdPrice(request.getProdPrice());
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

        // 1. 상품 번호로 상품 조회
        MileageProductEntity product = mileageProductRepository.findById(prodNo).orElseThrow(() -> new IllegalArgumentException(MileageProductResponse.Message.PRODUCT_NOT_FOUND));

        // 2. 회원 번호로 회원 조회
        MemberEntity member = memberRepository.findById(memberNo).orElseThrow(() -> new IllegalArgumentException(MemberResponse.Message.MEMBER_NOT_FOUND));

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

        return MileageProductDto.exchangeResult(true, MileageProductResponse.Message.PRODUCT_EXCHANGE_SUCCESS, member.getMileage());
    }
}
