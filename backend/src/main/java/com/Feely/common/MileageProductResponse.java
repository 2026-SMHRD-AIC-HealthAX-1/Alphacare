package com.Feely.common;

public final class MileageProductResponse {

    private MileageProductResponse() {
    }

    public static final class Message {
        public static final String REQUIRED_PRODUCT_INFO = "상품 정보가 누락되었습니다.";
        public static final String PRODUCT_NAME_REQUIRED = "상품명을 입력해주세요.";
        public static final String PRODUCT_PRICE_REQUIRED = "상품 가격을 입력해주세요.";
        public static final String PRODUCT_NOT_FOUND = "상품을 찾을 수 없습니다.";
        public static final String PRODUCT_REGISTRATION_SUCCESS = "상품이 등록되었습니다.";
        public static final String PRODUCT_UPDATE_SUCCESS = "상품이 수정되었습니다.";
        public static final String PRODUCT_LIST_SUCCESS = "상품 목록을 조회했습니다.";
        public static final String PRODUCT_INPUT_INVALID = "상품 정보가 올바르지 않습니다.";
    }

    public enum ErrorCode {
        REQUIRED_PRODUCT_INFO("PRODUCT_001"),
        PRODUCT_NAME_REQUIRED("PRODUCT_002"),
        PRODUCT_PRICE_REQUIRED("PRODUCT_003"),
        PRODUCT_NOT_FOUND("PRODUCT_004"),
        PRODUCT_REGISTRATION_SUCCESS("PRODUCT_200"),
        PRODUCT_UPDATE_SUCCESS("PRODUCT_201"),
        PRODUCT_LIST_SUCCESS("PRODUCT_200"),
        PRODUCT_INPUT_INVALID("PRODUCT_005");

        private final String code;

        ErrorCode(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}
