import React, { useEffect, useState } from 'react'
import { getMileageProducts, MileageProduct, exchangeMileageProduct } from "../../API/mileage";
import naverpay_5000 from "../../assets/naverpay_5000.png";
import naverpay_10000 from "../../assets/naverpay_10000.png";

import coffee_5000 from "../../assets/coffee_5000.png";
import coffee_10000 from "../../assets/coffee_10000.png";

import gs25_5000 from "../../assets/gs25_5000.png";
import gs25_10000 from "../../assets/gs25_10000.png";

import baemin_5000 from "../../assets/baemin_5000.png";
import baemin_10000 from "../../assets/baemin_10000.png";

import Feely_Diary from "../../assets/Feely_Diary.png";
import Feely_Diary_Detail from "../../assets/Feely_Diary_Detail.png";


// 보유 마일리지는 로그인 응답 body에 실려오는 mileage값을 로그인 시점에 localStorage("memberMileage")에
// 저장해두고, 마일리지샵에서는 그 캐시된 값을 초기값으로 표시함. 교환 성공 시에는 백엔드가
// GET /api/products/exchange/{prodNo} 응답으로 돌려주는 차감 후 마일리지값으로 갱신함
// 적립내역은 별도 조회 API가 없어서 아직 미구현
// 상품 목록/재고/가격은 DB(GET /api/products)에서 받아옴.

// DB에는 상품 이미지가 없어서 상품명으로 로컬 이미지를 매칭함 - 매칭되는 이름이 없으면 이미지 없이 표시됨
const PRODUCT_IMAGE_MAP: Record<string, string> = {
    "네이버페이 5,000원": naverpay_5000,
    "네이버페이 10,000원": naverpay_10000,
    "스타벅스 5,000원": coffee_5000,
    "스타벅스 10,000원": coffee_10000,
    "GS25 5,000원": gs25_5000,
    "GS25 10,000원": gs25_10000,
    "배달의민족 5,000원": baemin_5000,
    "배달의민족 10,000원": baemin_10000,
};

const diaryImages = [
    Feely_Diary,
    Feely_Diary_Detail
];

// Feely Diary는 DB 상품이 아니라(일기형/추억형 선택 등 별도 흐름) 항상 고정으로 보여주는 카드
const FEELY_DIARY_ITEM: { name: string; image: string; point: string; inventory?: number } = {
    name: "Feely Diary",
    image: Feely_Diary,
    point: "20,000P",
};

// 다이어리 종류 -> 교환 시 실제로 넘겨야 하는 DB 상품(prodNo)을 찾기 위한 상품명 매핑
// prodNo를 숫자로 하드코딩하지 않고, 상품 목록(dbProducts)에서 이 이름으로 찾아서 사용함
const DIARY_PRODUCT_NAME: Record<string, string> = {
    "일기형": "Diary_diary",
    "추억형": "Diary_memory",
};

export default function Mshop() {
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; image: string; point: string; inventory?: number; prodNo?: number } | null>(null);
    const [diaryIndex, setDiaryIndex] = useState(0);
    const [diaryDirection, setDiaryDirection] = useState("right");
    const [isSliding, setIsSliding] = useState(false);
    const [selectedDiaryType, setSelectedDiaryType] = useState<string | null>(null);
    const [diaryStartDate, setDiaryStartDate] = useState("");
    const [diaryEndDate, setDiaryEndDate] = useState("");
    // 마일리지 상품 목록 (백엔드 DB 연동)
    const [dbProducts, setDbProducts] = useState<MileageProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setProductsLoading(true);
                setProductsError(false);
                const data = await getMileageProducts();
                setDbProducts(data);
            } catch (err) {
                console.error("마일리지 상품 목록을 불러오지 못했습니다:", err);
                setProductsError(true);
            } finally {
                setProductsLoading(false);
            }
        };

        loadProducts();
    }, []);

    // 보유 마일리지 - 로그인 시 응답 body로 받아서 localStorage에 저장해둔 값을 초기값으로 사용하고,
    // 교환에 성공하면 백엔드가 돌려주는 차감 후 값으로 갱신함(applyMileage)
    const [memberMileage, setMemberMileage] = useState<number | null>(() => {
        try {
            const cached = localStorage.getItem("memberMileage");
            return cached !== null ? Number(cached) : null;
        } catch {
            return null;
        }
    });

    // 교환 요청 진행 상태 / 실패 메시지 (모달 안에서 표시)
    const [exchanging, setExchanging] = useState(false);
    const [exchangeError, setExchangeError] = useState<string | null>(null);

    // 화면 3곳(상단 배지 / 상품권 교환 모달 / 다이어리 교환 모달)에서 공통으로 쓰는 표시용 문자열
    const mileageDisplay = memberMileage !== null
        ? `${memberMileage.toLocaleString()} P`
        : "- P";

    // 교환 성공 시 마일리지 상태 + localStorage 캐시를 같이 갱신
    const applyMileage = (value: number | null) => {
        setMemberMileage(value);
        if (value !== null) {
            try {
                localStorage.setItem("memberMileage", String(value));
            } catch {
                // localStorage를 못 쓰는 환경이면 무시
            }
        }
    };

    // 상품 교환 요청 - GET /api/products/exchange/{prodNo} 호출 결과에 따라 성공/실패 처리
    // (401은 axios.ts의 공통 인터셉터가 세션만료 처리를 이미 하므로 여기서는 그 외 실패만 처리)
    const requestExchange = async (prodNo: number): Promise<boolean> => {
        setExchanging(true);
        setExchangeError(null);
        try {
            const data = await exchangeMileageProduct(prodNo);
            if (data.success === false) {
                setExchangeError(data.message || "교환에 실패했습니다.");
                return false;
            }
            applyMileage(data.mileage);
            return true;
        } catch (err: any) {
            // 401(세션 만료)은 axios 인터셉터가 알림 + 메인페이지 이동을 공통으로 처리하므로
            // 여기서 별도 메시지를 띄우면 리다이렉트 직전에 잘못된 문구가 잠깐 보일 수 있어 건너뜀
            if (err?.response?.status === 401) {
                return false;
            }

            const serverMessage = err?.response?.data?.message;
            setExchangeError(
                typeof serverMessage === "string" && serverMessage
                    ? serverMessage
                    : "교환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            );
            return false;
        } finally {
            setExchanging(false);
        }
    };

    // DB 상품을 카드에서 쓰는 형태로 변환
    // 1순위: DB에 저장된 실제 상품 이미지(prodImage, base64) - 백엔드에 등록된 상품이면 항상 있음
    // 2순위: 상품명으로 매칭되는 로컬 이미지 (DB 이미지가 없는 예전 데이터 대비)
    // 둘 다 없으면 빈 문자열 -> 카드에서 🎁 아이콘으로 대체
    // Diary_diary / Diary_memory는 DB에 남아있는 다이어리 상품이지만
    // 화면에는 아래의 큰 Feely Diary 카드 하나만 노출하므로 목록에서 제외
    const productItems = dbProducts
        .filter((p) => p.prodName !== "Diary_diary" && p.prodName !== "Diary_memory")
        .map((p) => ({
            name: p.prodName,
            image: p.prodImage
                ? `data:image/jpeg;base64,${p.prodImage}`
                : PRODUCT_IMAGE_MAP[p.prodName] ?? "",
            point: `${p.prodPrice.toLocaleString()}P`,
            inventory: p.prodInventory,
            prodNo: p.prodNo,
        }));

    const products = [...productItems, FEELY_DIARY_ITEM];
    return (
        <>
            <style>{`
                @keyframes diaryCurrentToLeft {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-100%);
                    }
                }

                @keyframes diaryNextToLeft {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes diaryCurrentToRight {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(100%);
                    }
                }

                @keyframes diaryPrevToRight {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                .diary-current-left {
                    animation: diaryCurrentToLeft 0.5s ease-in-out forwards;
                }

                .diary-next-left {
                    animation: diaryNextToLeft 0.5s ease-in-out forwards;
                }

                .diary-current-right {
                    animation: diaryCurrentToRight 0.5s ease-in-out forwards;
                }

                .diary-prev-right {
                    animation: diaryPrevToRight 0.5s ease-in-out forwards;
                }
            `}</style>


            <div className="w-full max-w-7xl mx-auto py-4 px-2 sm:px-4 lg:px-6 min-h-screen">
                <main className="w-full min-w-0">

                    {/* 상단 마일리지 영역 */}
                    <div className="p-4 sm:p-6 mb-0">
                        <div className="w-full flex justify-center">

                            {/* 보유 마일리지 */}
                            <div className="flex items-center justify-center gap-3 py-2 sm:py-0">
                                <p className="text-gray-500 dark:text-gray-400">보유 마일리지</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-teal-400">
                                    {mileageDisplay}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* 마일리지와 상품권 영역 구분선 */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-[0px] mb-[20px]"></div>

                    

                    {/* 상품권 목록 */}
                    <div className="overflow-hidden">
                        <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch min-w-0">
                            {productsLoading ? (
                                <div className="col-span-2 sm:col-span-4 flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
                                    상품 목록을 불러오는 중입니다...
                                </div>
                            ) : productsError ? (
                                <div className="col-span-2 sm:col-span-4 flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
                                    상품 목록을 불러오지 못했습니다.
                                </div>
                            ) : (
                                products.map((item, idx) => {

                                // Feely Diary
                                if (item.name === "Feely Diary") {
                                    const prevDiaryIndex =
                                        diaryIndex === 0
                                            ? diaryImages.length - 1
                                            : diaryIndex - 1;

                                    const nextDiaryIndex =
                                        diaryIndex === diaryImages.length - 1
                                            ? 0
                                            : diaryIndex + 1;

                                    return (
                                        <React.Fragment key={idx}>

                                            {/* 다이어리 이미지 */}
                                            <div className="col-span-2 sm:col-span-3 min-w-0 h-[260px] sm:h-[300px] lg:h-[350px] xl:h-[400px] 2xl:h-[440px] p-0 m-0 overflow-hidden relative">
                                                <div className="w-full h-full overflow-hidden relative">

                                                    {/* 현재 이미지 */}
                                                    <img
                                                        src={diaryImages[diaryIndex]}
                                                        alt={item.name}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />

                                                    {/* 오른쪽으로 이동: 다음 이미지 */}
                                                    {isSliding && diaryDirection === "right" && (
                                                        <>
                                                            <img
                                                                src={diaryImages[diaryIndex]}
                                                                alt={item.name}
                                                                className="absolute inset-0 w-full h-full object-cover diary-current-left"
                                                            />

                                                            <img
                                                                src={diaryImages[nextDiaryIndex]}
                                                                alt={item.name}
                                                                className="absolute inset-0 w-full h-full object-cover diary-next-left"
                                                                onAnimationEnd={() => {
                                                                    setDiaryIndex(nextDiaryIndex);
                                                                    setIsSliding(false);
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                    {/* 왼쪽으로 이동: 이전 이미지 */}
                                                    {isSliding && diaryDirection === "left" && (
                                                        <>
                                                            <img
                                                                src={diaryImages[diaryIndex]}
                                                                alt={item.name}
                                                                className="absolute inset-0 w-full h-full object-cover diary-current-right"
                                                            />

                                                            <img
                                                                src={diaryImages[prevDiaryIndex]}
                                                                alt={item.name}
                                                                className="absolute inset-0 w-full h-full object-cover diary-prev-right"
                                                                onAnimationEnd={() => {
                                                                    setDiaryIndex(prevDiaryIndex);
                                                                    setIsSliding(false);
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                </div>

                                                {/* 왼쪽 화살표 */}
                                                <button
                                                    onClick={() => {
                                                        if (isSliding) return;
                                                        setDiaryDirection("left");
                                                        setIsSliding(true);
                                                    }}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2
                                                    w-7 h-7 rounded-full
                                                    bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800
                                                    transition
                                                    flex items-center justify-center z-10"
                                                >
                                                    <span className="relative -left-[1px] -top-[2px]
                                                    text-xl font-light text-gray-500 dark:text-gray-400
                                                    leading-none">
                                                        ‹
                                                    </span>
                                                </button>

                                                {/* 오른쪽 화살표 */}
                                                <button
                                                    onClick={() => {
                                                        if (isSliding) return;
                                                        setDiaryDirection("right");
                                                        setIsSliding(true);
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2
                                                    w-7 h-7 rounded-full
                                                    bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800
                                                    transition
                                                    flex items-center justify-center z-10"
                                                >
                                                    <span className="relative left-[1px] -top-[2px]
                                                    text-xl font-light text-gray-500 dark:text-gray-400
                                                    leading-none">
                                                        ›
                                                    </span>
                                                </button>

                                            </div>

                                            {/* 다이어리 선택 버튼 */}
                                            <div className="col-span-2 sm:col-span-1 h-[260px] sm:h-[300px] lg:h-[350px] xl:h-[400px] 2xl:h-[440px] min-w-0 relative overflow-hidden">

                                                <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-0 sm:translate-y-[-10px] px-2">

                                                    {/* 다이어리 이름 */}
                                                    <p className="relative top-0 sm:top-[-20px] text-[18px] sm:text-[20px] leading-5 font-semibold text-center">
                                                        Feely Diary
                                                    </p>

                                                    {/* 가격 */}
                                                    <p className="relative top-0 sm:top-[-15px] mt-1 text-[16px] sm:text-[18px] text-[#1F6170] dark:text-teal-400 leading-5 font-semibold text-center">
                                                        20,000p
                                                    </p>

                                                    {/* 하루의 끝 */}
                                                    <p className="relative top-0 sm:top-[25px] mt-1 text-[14px] text-gray-500 dark:text-gray-400 text-center mb-2 sm:mb-3">
                                                        하루의 끝
                                                    </p>

                                                    {/* 일기형 */}
                                                    <button
                                                        onClick={() => {
                                                            setExchangeError(null);
                                                            setSelectedDiaryType("일기형");
                                                        }}
                                                        className="relative top-0 sm:top-[30px] w-[120px] h-[30px] bg-[#0D9488] text-sm sm:text-[15px] text-white rounded-lg flex items-center justify-center text-center mb-3 sm:mb-5"
                                                    >
                                                        일기형
                                                    </button>

                                                    {/* 상담기록 */}
                                                    <p className="relative top-0 sm:top-[25px] text-[14px] text-gray-500 dark:text-gray-400 text-center mb-2 sm:mb-3">
                                                        상담기록
                                                    </p>

                                                    {/* 추억형 */}
                                                    <button
                                                        onClick={() => {
                                                            setExchangeError(null);
                                                            setSelectedDiaryType("추억형");
                                                        }}
                                                        className="relative top-0 sm:top-[30px] w-[120px] h-[30px] bg-[#0D9488] text-sm sm:text-[15px] text-white rounded-lg flex items-center justify-center text-center"
                                                    >
                                                        추억형
                                                    </button>

                                                </div>

                                            </div>

                                        </React.Fragment>
                                    );
                                }

                                // 일반 상품권
                                return (
                                    <div
                                        key={idx}
                                        className={`
            min-w-0
            p-3 sm:p-4
            flex flex-col items-center
            min-h-[245px] sm:min-h-[300px]
        `}
                                    >

                                        {/* 상품 이미지 (DB에 이미지가 없는 상품이면 대체 아이콘 표시) */}
                                        <div className="w-full h-[110px] sm:h-[140px] md:h-[160px] flex items-center justify-center min-w-0 shrink-0">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                                                    🎁
                                                </div>
                                            )}
                                        </div>

                                        {/* 상품명 */}
                                        <p className="w-full min-w-0 mt-3 text-xs sm:text-[14px] leading-5 font-semibold text-center break-keep">
                                            {item.name}
                                        </p>

                                        {/* 가격 */}
                                        <p className="w-full min-w-0 mt-2 text-xs sm:text-[14px] leading-5 text-[#1F6170] dark:text-teal-400 font-bold text-center">
                                            {item.point}
                                        </p>

                                        {/* 재고 없으면 품절 표시, 있으면 교환 버튼 */}
                                        {item.inventory !== undefined && item.inventory <= 0 ? (
                                            <span className="w-[120px] h-[30px] mt-3 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg text-[14px] text-center flex items-center justify-center whitespace-nowrap">
                                                품절
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setExchangeError(null);
                                                    setSelectedProduct(item);
                                                }}
                                                className="w-[120px] h-[30px] mt-3 bg-[#0D9488] text-white rounded-lg text-[14px] text-center flex items-center justify-center whitespace-nowrap"
                                            >
                                                교환하기
                                            </button>
                                        )}

                                    </div>
                                );
                                })
                            )}
                        </div>
                    </div >

                    {/* 마일리지 안내 */}
                    <div className="w-full border-t border-gray-300 dark:border-gray-700 mt-[60px] p-4 sm:p-5 text-gray-600 dark:text-gray-400">
                        <p className="text-[14px] sm:text-[16px] font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            주의 사항
                        </p>
                        <div className="text-[10px] sm:text-xs leading-6 sm:leading-7">
                            <p>• 마일리지는 하루에 한 번, 상담 종료 후 자동 적립됩니다.</p>
                            <p>• 적립 내역은 마일리지 내역을 통해 확인 가능합니다.</p>
                            <p>• 교환요청 하신 금액상품권은 등록된 핸드폰번호로 발송됩니다.</p>
                            <p>• 교환한 마일리지는 환불되지 않습니다.</p>
                            <p>• 유효기간 연장은 불가능합니다.</p>
                            <p>• 마일리지를 현금으로 교환할 수 없습니다.</p>
                        </div>
                    </div>


                    {/* 상품 교환 확인 모달 */}
                    {
                        selectedProduct && (
                            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-[calc(100%-2rem)] max-w-[450px] shadow-lg">

                                    {/* 제목 */}
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold">
                                            상품 교환
                                        </h2>

                                        <button
                                            onClick={() => {
                                                setExchangeError(null);
                                                setSelectedProduct(null);
                                            }}
                                            className="text-xl text-gray-500 dark:text-gray-400"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* 안내 문구 */}
                                    <div className="text-center mb-6">
                                        <p className="text-lg font-semibold mb-2">
                                            해당 상품으로 교환하시겠습니까?
                                        </p>

                                        <p className="text-[#1F6170] dark:text-teal-400 font-bold mb-3">
                                            {selectedProduct.name}
                                        </p>

                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            교환한 마일리지는 환불되지않습니다.<br />
                                            교환한 상품은 등록하신 핸드폰번호로 발송됩니다.
                                        </p>
                                    </div>

                                    {/* 마일리지 정보 */}
                                    <div className="border rounded-lg p-4 mb-6">
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                보유마일리지
                                            </span>

                                            <span className="font-bold">
                                                {mileageDisplay}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                상품가격
                                            </span>

                                            <span className="font-bold text-[#1F6170] dark:text-teal-400">
                                                {selectedProduct.point}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 실패 메시지 */}
                                    {exchangeError && (
                                        <p className="text-red-500 text-sm text-center mb-4">{exchangeError}</p>
                                    )}

                                    {/* 최종 교환 버튼 */}
                                    <button
                                        onClick={async () => {
                                            if (selectedProduct.prodNo === undefined) return;
                                            const success = await requestExchange(selectedProduct.prodNo);
                                            if (success) setSelectedProduct(null);
                                        }}
                                        disabled={exchanging}
                                        className="w-full bg-[#0D9488] text-white py-3 rounded-lg font-semibold disabled:opacity-60"
                                    >
                                        {exchanging ? "처리 중..." : "교환하기"}
                                    </button>

                                </div>

                            </div>
                        )
                    }
                    {/* 다이어리 전용 교환 팝업 */}
                    {
                        selectedDiaryType && (
                            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-[calc(100%-2rem)] max-w-[450px] shadow-lg text-[13px]">

                                    {/* 제목 */}
                                    <div className="flex justify-between items-center mb-6">

                                        <h2 className="text-[18px] font-bold">
                                            다이어리 교환
                                        </h2>

                                        <button
                                            onClick={() => {
                                                setExchangeError(null);
                                                setSelectedDiaryType(null);
                                                setDiaryStartDate("");
                                                setDiaryEndDate("");
                                            }}
                                            className="text-[18px] text-gray-500 dark:text-gray-400"
                                        >
                                            ✕
                                        </button>

                                    </div>


                                    {/* 상품 정보 */}
                                    <div className="text-center mb-6">

                                        <p className="text-lg font-semibold mb-2">
                                            해당 상품으로 교환하시겠습니까?
                                        </p>

                                        <p className="text-[17px] text-[#1F6170] dark:text-teal-400 font-bold mb-4">
                                            Feely Diary - {selectedDiaryType}
                                        </p>


                                        {/* 추억형일 때만 상담 기간 선택 */}
                                        {selectedDiaryType === "추억형" && (

                                            <div className="border rounded-lg p-4 mb-5 text-left">

                                                {/* 기간 제목 */}
                                                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1 text-center">
                                                    상담 기간을 선택해주세요
                                                </p>

                                                {/* 최대 기간 안내 */}
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3 text-center">
                                                    최대 3개월까지 선택할 수 있습니다.
                                                </p>


                                                {/* 날짜 선택 */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">

                                                    {/* 시작일 */}
                                                    <div className="w-full sm:flex-1">

                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                                                            시작일
                                                        </p>

                                                        <input
                                                            type="date"
                                                            value={diaryStartDate}
                                                            onChange={(e) => {

                                                                const newStartDate =
                                                                    e.target.value;

                                                                setDiaryStartDate(newStartDate);

                                                                // 시작일을 새로 선택하면
                                                                // 기존 종료일 초기화
                                                                setDiaryEndDate("");
                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-[#1F6170]"
                                                        />

                                                    </div>


                                                    {/* 물결 표시 */}
                                                    <div className="hidden sm:block pb-2 text-gray-400 dark:text-gray-500 text-[12px] font-medium">
                                                        ~
                                                    </div>


                                                    {/* 종료일 */}
                                                    <div className="w-full sm:flex-1">

                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                                                            종료일
                                                        </p>

                                                        <input
                                                            type="date"
                                                            value={diaryEndDate}
                                                            min={
                                                                diaryStartDate || undefined
                                                            }
                                                            max={
                                                                diaryStartDate
                                                                    ? (() => {

                                                                        const maxDate =
                                                                            new Date(
                                                                                diaryStartDate
                                                                            );

                                                                        maxDate.setMonth(
                                                                            maxDate.getMonth() + 3
                                                                        );

                                                                        const year =
                                                                            maxDate.getFullYear();

                                                                        const month =
                                                                            String(
                                                                                maxDate.getMonth() + 1
                                                                            ).padStart(2, "0");

                                                                        const day =
                                                                            String(
                                                                                maxDate.getDate()
                                                                            ).padStart(2, "0");

                                                                        return `${year}-${month}-${day}`;

                                                                    })()
                                                                    : undefined
                                                            }
                                                            onChange={(e) => {

                                                                const selectedEndDate =
                                                                    e.target.value;


                                                                if (
                                                                    diaryStartDate &&
                                                                    selectedEndDate
                                                                ) {

                                                                    const endDate =
                                                                        new Date(
                                                                            selectedEndDate
                                                                        );

                                                                    const maxDate =
                                                                        new Date(
                                                                            diaryStartDate
                                                                        );

                                                                    maxDate.setMonth(
                                                                        maxDate.getMonth() + 3
                                                                    );


                                                                    // 3개월 초과 확인
                                                                    if (
                                                                        endDate > maxDate
                                                                    ) {

                                                                        alert(
                                                                            "상담 기간은 최대 3개월까지 선택할 수 있습니다."
                                                                        );

                                                                        setDiaryEndDate("");

                                                                        return;
                                                                    }

                                                                }


                                                                setDiaryEndDate(
                                                                    selectedEndDate
                                                                );

                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-[#1F6170]"
                                                        />

                                                    </div>

                                                </div>

                                            </div>

                                        )}


                                        {/* 안내 문구 */}
                                        <div className="text-[12px] text-gray-500 dark:text-gray-400 leading-5">

                                            {/* 추억형 전용 안내 */}
                                            {selectedDiaryType === "추억형" && (
                                                <>
                                                    <p>
                                                        상담기록이 부족한 경우 남은 페이지는 노트형 속지로 구성됩니다.
                                                    </p>

                                                    <p>
                                                        배송지를 요청하는 문자가 발송되니 꼭 회신 부탁드립니다.
                                                    </p>
                                                </>
                                            )}


                                            {/* 일기형 전용 안내 */}
                                            {selectedDiaryType === "일기형" && (
                                                <p>
                                                    배송지를 요청하는 문자가 발송되니 꼭 회신 부탁드립니다.
                                                </p>
                                            )}


                                            {/* 기존 안내 문구 */}
                                            <p>
                                                교환한 마일리지는 환불되지않습니다.
                                            </p>

                                        </div>

                                    </div>


                                    {/* 마일리지 정보 */}
                                    <div className="border rounded-lg p-4 mb-6">

                                        {/* 보유 마일리지 */}
                                        <div className="flex justify-between mb-3">

                                            <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                                                보유 마일리지
                                            </span>

                                            <span className="font-bold text-[15px]">
                                                {mileageDisplay}
                                            </span>

                                        </div>


                                        {/* 상품 가격 */}
                                        <div className="flex justify-between">

                                            <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                                                상품 가격
                                            </span>

                                            <span className="font-bold text-[#1F6170] dark:text-teal-400 text-[15px]">
                                                20,000 P
                                            </span>

                                        </div>

                                    </div>


                                    {/* 실패 메시지 */}
                                    {exchangeError && (
                                        <p className="text-red-500 text-sm text-center mb-4">{exchangeError}</p>
                                    )}

                                    {/* 최종 교환 버튼 */}
                                    <button
                                        onClick={async () => {

                                            {/* 추억형 기간 미선택 확인 */ }
                                            if (
                                                selectedDiaryType === "추억형" &&
                                                (!diaryStartDate || !diaryEndDate)
                                            ) {

                                                alert(
                                                    "상담 기간을 선택해주세요."
                                                );

                                                return;
                                            }

                                            {/* 다이어리 종류 -> 실제 DB 상품번호(prodNo) 찾기 */ }
                                            const prodNo = selectedDiaryType
                                                ? dbProducts.find(
                                                    (p) => p.prodName === DIARY_PRODUCT_NAME[selectedDiaryType]
                                                )?.prodNo
                                                : undefined;

                                            if (prodNo === undefined) {
                                                setExchangeError("다이어리 상품 정보를 찾을 수 없습니다.");
                                                return;
                                            }

                                            const success = await requestExchange(prodNo);
                                            if (!success) return;

                                            {/* 팝업 닫기 */ }
                                            setSelectedDiaryType(null);

                                            {/* 날짜 초기화 */ }
                                            setDiaryStartDate("");
                                            setDiaryEndDate("");

                                        }}
                                        disabled={
                                            exchanging ||
                                            (selectedDiaryType === "추억형" &&
                                                (!diaryStartDate || !diaryEndDate))
                                        }
                                        className={`w-full py-3 rounded-lg font-semibold text-[16px] text-white ${exchanging ||
                                            (selectedDiaryType === "추억형" &&
                                                (!diaryStartDate || !diaryEndDate))
                                            ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                                            : "bg-[#0D9488] hover:bg-[#0D9488]"
                                            }`}
                                    >
                                        {exchanging ? "처리 중..." : "교환하기"}
                                    </button>

                                </div>

                            </div>
                        )
                    }

                </main >
            </div >
        </>
    );
}