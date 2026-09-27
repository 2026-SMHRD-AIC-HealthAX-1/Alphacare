// 마일리지 상품 API
import { api } from "./axios";
import { MemberMileageResponse } from "./user";

// 마일리지 상품 타입 (이미지는 base64 문자열)
export interface MileageProduct {
  prodNo: number;
  prodName: string;
  prodInventory: number;
  prodPrice: number;
  prodImage: string | null;
}

// 상품 전체 목록 조회 (배열이 아니면 빈 배열)
export const getMileageProducts = async (): Promise<MileageProduct[]> => {
  const response = await api.get<MileageProduct[]>("/api/products");
  return Array.isArray(response.data) ? response.data : [];
};

// 상품 교환 (결과와 차감 후 마일리지 반환)
export const exchangeMileageProduct = async (prodNo: number): Promise<MemberMileageResponse> => {
  const response = await api.get<MemberMileageResponse>(`/api/products/exchange/${prodNo}`);
  return response.data;
};

// 상품 정보 수정 (가격/이미지 등 변경된 값만 전달, 이미지는 base64 - data URL 접두어 제외)
export const updateMileageProduct = async (
  prodNo: number,
  updates: { prodPrice?: number; prodImage?: string }
): Promise<MileageProduct> => {
  const response = await api.put<MileageProduct>(`/api/products/${prodNo}`, updates);
  return response.data;
};
