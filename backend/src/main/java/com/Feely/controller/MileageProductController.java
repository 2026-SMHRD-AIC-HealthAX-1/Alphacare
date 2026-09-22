package com.Feely.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.common.ProductResponse;
import com.Feely.dto.MileageProductDto;
import com.Feely.entity.MileageProductEntity;
import com.Feely.service.MileageProductService;

@RestController
@RequestMapping("/api")
public class MileageProductController {

    private final MileageProductService mileageProductService;

    public MileageProductController(MileageProductService mileageProductService) {
        this.mileageProductService = mileageProductService;
    }

    // 상품 전체 목록 조회
    @GetMapping("/products")
    public ResponseEntity<MileageProductDto> getProducts() {

        // 상품 전체 조회
        MileageProductDto result = mileageProductService.getProducts();
        return ResponseEntity.ok(result);
    }

    // 상품 단일 조회
    @GetMapping("/products/{id}")
    public ResponseEntity<MileageProductDto> getProduct(@PathVariable Long id) {

        // 상품 조회
        MileageProductDto result = mileageProductService.getProduct(id);

        // 상품이 존재하지 않을 경우 404 Not Found 응답
        if (Boolean.FALSE.equals(result.success())) {
            return ResponseEntity.status(404).body(result);
        }

        // 상품이 존재할 경우 200 OK 응답
        return ResponseEntity.ok(result);
    }

    // 상품 등록
    @PostMapping("/products")
    public ResponseEntity<MileageProductDto> createProduct(@RequestBody MileageProductEntity request) {

        // 상품명 유효성 검사
        if (request == null || isBlank(request.getProdName())) {

            // 상품명 누락 시 400 Bad Request 응답
            return ResponseEntity.badRequest()
                    .body(MileageProductDto.saveResult(false, ProductResponse.Message.PRODUCT_NAME_REQUIRED));
        }

        // 상품 가격 유효성 검사
        if (request.getProdPrice() < 0) {
            // 상품 가격이 음수일 경우 400 Bad Request 응답
            return ResponseEntity.badRequest()
                    .body(MileageProductDto.saveResult(false, ProductResponse.Message.PRODUCT_PRICE_REQUIRED));
        }

        // 상품 등록
        MileageProductDto result = mileageProductService.createProduct(request);

        // 상품 등록 실패 시 400 Bad Request 응답
        if (Boolean.FALSE.equals(result.success())) {
            return ResponseEntity.badRequest().body(result);
        }

        // 상품 등록 성공 시 200 OK 응답
        return ResponseEntity.ok(result);
    }

    // 상품 수정
    @PutMapping("/products/{id}")
    public ResponseEntity<MileageProductDto> updateProduct(@PathVariable Long id,
            @RequestBody MileageProductEntity request) {

        // 상품 정보가 null인 경우 400 Bad Request 응답
        if (request == null) {
            return ResponseEntity.badRequest()
                    .body(MileageProductDto.updateResult(false, ProductResponse.Message.PRODUCT_INPUT_INVALID));
        }

        // 상품 수정
        MileageProductDto result = mileageProductService.updateProduct(id, request);

        // 상품이 존재하지 않을 경우 404 Not Found 응답
        if (Boolean.FALSE.equals(result.success())) {
            return ResponseEntity.status(404).body(result);
        }

        // 상품 수정 성공 시 200 OK 응답
        return ResponseEntity.ok(result);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
