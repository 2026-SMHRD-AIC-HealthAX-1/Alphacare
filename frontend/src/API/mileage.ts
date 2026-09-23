// 마일리지 상품 조회
import { api } from "./axios";
import { MemberMileageResponse } from "./user";

// 백엔드 MileageProductDto와 매칭되는 타입 (목록 조회 응답에도 message/success가 같이 오지만 화면엔 안 씀)
// prodImage는 백엔드가 byte[](mediumblob)로 내려주는데, Jackson이 자동으로 base64 문자열로 직렬화해줌
export interface MileageProduct {
  prodNo: number;
  prodName: string;
  prodInventory: number;
  prodPrice: number;
  prodImage: string | null;
}

// 마일리지 상품 전체 목록 조회
// 백엔드 getProducts()가 아직 배열이 아니라 단일 객체를 돌려줄 때가 있어서(알려진 백엔드 버그),
// 배열이 아닌 응답이 오면 빈 배열로 처리해서 화면이 통째로 터지지 않게 함
export const getMileageProducts = async (): Promise<MileageProduct[]> => {
  const response = await api.get<MileageProduct[]>("/api/products");
  return Array.isArray(response.data) ? response.data : [];
};

// 마일리지 상품 교환 - GET /api/products/exchange/{prodNo} 호출 하나로 백엔드가 재고/마일리지
// 확인, 차감, 저장까지 다 처리하고 결과(성공 여부 + 차감 후 마일리지)를 돌려줌.
// 로그인 세션 쿠키가 필요해서(백엔드가 세션으로 회원을 확인) axios 인스턴스(api)를 그대로 사용함
export const exchangeMileageProduct = async (prodNo: number): Promise<MemberMileageResponse> => {
  const response = await api.get<MemberMileageResponse>(`/api/products/exchange/${prodNo}`);
  return response.data;
};
