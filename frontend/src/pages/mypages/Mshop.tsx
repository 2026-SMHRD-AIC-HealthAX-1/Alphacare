import React, { useState, useEffect } from 'react'
import { getMileageProducts, MileageProduct } from "../../API/mileage";
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


// 보유 마일리지/적립내역은 아직 회원 마일리지 조회 API가 없어서 하드코딩 상태로 남겨둠.
// 상품 목록/재고/가격은 DB(GET /api/products)에서 받아옴.
// 교환 API는 아직 없어서 교환 버튼은 확인 모달까지만 동작함 (실제 차감/재고 반영은 별도 작업 필요)

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

export default function Mshop() {
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; image: string; point: string; inventory?: number } | null>(null);
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

    // DB 상품을 카드에서 쓰는 형태로 변환 (이미지가 매칭 안 되면 빈 문자열 -> 카드에서 아이콘으로 대체)
    const productItems = dbProducts.map((p) => ({
        name: p.prodName,
        image: PRODUCT_IMAGE_MAP[p.prodName] ?? "",
        point: `${p.prodPrice.toLocaleString()}P`,
        inventory: p.prodInventory,
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
                        <div className="grid grid-cols-1 sm:grid-cols-2">

                            {/* 보유 마일리지 */}
                            <div className="flex items-center justify-center gap-3 py-2 sm:py-0 relative left-[-100px]">
                                <p className="text-gray-500 dark:text-gray-400">보유 마일리지</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-teal-400">
                                    12,500 P
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
                                            <div className="col-span-2 sm:col-span-3 min-w-0 h-[260px] sm:h-[300px] lg:h-[350px] p-0 m-0 overflow-hidden relative">
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
                                            <div className="col-span-2 sm:col-span-1 h-[260px] sm:h-[300px] lg:h-[350px] min-w-0 relative overflow-hidden">

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
                                                        onClick={() => setSelectedDiaryType("일기형")}
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
                                                        onClick={() => setSelectedDiaryType("추억형")}
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
                                                onClick={() => setSelectedProduct(item)}
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
                                            onClick={() => setSelectedProduct(null)}
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
                                                12,500 P
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

                                    {/* 최종 교환 버튼 */}
                                    <button
                                        onClick={() => {
                                            console.log("상품 교환:", selectedProduct.name);

                                            // 실제 교환 API 연결 부분
                                            setSelectedProduct(null);
                                        }}
                                        className="w-full bg-[#0D9488] text-white py-3 rounded-lg font-semibold"
                                    >
                                        교환하기
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
                                                12,500 P
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


                                    {/* 최종 교환 버튼 */}
                                    <button
                                        onClick={() => {

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


                                            {/* 실제 교환 API 연결 부분 */ }
                                            console.log(
                                                "다이어리 교환:",
                                                selectedDiaryType,
                                                diaryStartDate,
                                                diaryEndDate
                                            );


                                            {/* 팝업 닫기 */ }
                                            setSelectedDiaryType(null);

                                            {/* 날짜 초기화 */ }
                                            setDiaryStartDate("");
                                            setDiaryEndDate("");

                                        }}
                                        disabled={
                                            selectedDiaryType === "추억형" &&
                                            (!diaryStartDate || !diaryEndDate)
                                        }
                                        className={`w-full py-3 rounded-lg font-semibold text-[16px] text-white ${selectedDiaryType === "추억형" &&
                                            (!diaryStartDate || !diaryEndDate)
                                            ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                                            : "bg-[#0D9488] hover:bg-[#0D9488]"
                                            }`}
                                    >
                                        교환하기
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