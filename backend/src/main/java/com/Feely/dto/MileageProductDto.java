package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MileageProductDto(
        @JsonProperty("prodNo") Long prodNo,
        @JsonProperty("prodName") String prodName,
        @JsonProperty("prodInventory") Integer prodInventory,
        @JsonProperty("prodPrice") Integer prodPrice,
        @JsonProperty("prodImage") byte[] prodImage,
        
        @JsonProperty("message") String message,
        @JsonProperty("success") Boolean success
) {
    public static MileageProductDto listResult(boolean success, String message) {
        return new MileageProductDto(null, null, null, null, null, message, success);
    }

    public static MileageProductDto detailResult(Long prodNo, String prodName, Integer prodInventory, Integer prodPrice, byte[] prodImage, String message, boolean success) {
        return new MileageProductDto(prodNo, prodName, prodInventory, prodPrice, prodImage, message, success);
    }

    public static MileageProductDto saveResult(boolean success, String message) {
        return new MileageProductDto(null, null, null, null, null, message, success);
    }

    public static MileageProductDto updateResult(boolean success, String message) {
        return new MileageProductDto(null, null, null, null, null, message, success);
    }
}
