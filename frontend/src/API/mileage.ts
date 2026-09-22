// 마일리지 상품 조회
import { api } from "./axios";

// 백엔드 MileageProductDto와 매칭되는 타입 (목록 조회 응답에도 message/success가 같이 오지만 화면엔 안 씀)
export interface MileageProduct {
  prodNo: number;
  prodName: string;
  prodInventory: number;
  prodPrice: number;
}

// 마일리지 상품 전체 목록 조회
// 백엔드 getProducts()가 아직 배열이 아니라 단일 객체를 돌려줄 때가 있어서(알려진 백엔드 버그),
// 배열이 아닌 응답이 오면 빈 배열로 처리해서 화면이 통째로 터지지 않게 함
export const getMileageProducts = async (): Promise<MileageProduct[]> => {
  const response = await api.get<MileageProduct[]>("/api/products");
  return Array.isArray(response.data) ? response.data : [];
};
