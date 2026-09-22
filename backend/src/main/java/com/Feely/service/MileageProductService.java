package com.Feely.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.Feely.common.MileageProductResponse;
import com.Feely.dto.MileageProductDto;
import com.Feely.entity.MileageProductEntity;
import com.Feely.repository.MileageProductRepository;

@Service
public class MileageProductService {

    private final MileageProductRepository mileageProductRepository;

    // 생성자 주입
    public MileageProductService(MileageProductRepository mileageProductRepository) {
        this.mileageProductRepository = mileageProductRepository;
    }

    // 상품 전체 조회
    public MileageProductDto getProducts() {
        List<MileageProductEntity> products = mileageProductRepository.findAll();
        return MileageProductDto.listResult(true, MileageProductResponse.Message.PRODUCT_LIST_SUCCESS);
    }

    // 상품 단일 조회
    public MileageProductDto getProduct(Long id) {
        Optional<MileageProductEntity> product = mileageProductRepository.findById(id);
        if (product.isEmpty()) {
            return MileageProductDto.detailResult(null, null, null, null,
                    MileageProductResponse.Message.PRODUCT_NOT_FOUND, false);
        }

        MileageProductEntity entity = product.get();
        return MileageProductDto.detailResult(entity.getProdNo(), entity.getProdName(),
                entity.getProdInventory(), entity.getProdPrice(),
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
                saved.getProdInventory(), saved.getProdPrice(),
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
                updated.getProdInventory(), updated.getProdPrice(),
                MileageProductResponse.Message.PRODUCT_UPDATE_SUCCESS, true);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
