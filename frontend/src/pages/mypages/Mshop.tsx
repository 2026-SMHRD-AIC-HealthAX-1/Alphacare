import React, { useState } from 'react'
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


{/* 보유 마일리지, 적립내역 회원번호와 연동필요, 금액권 재고 연동 필요, 금액권 교환 후 마일리지 차감내역 확인필요 */}
const diaryImages = [
    Feely_Diary,
    Feely_Diary_Detail
];

export default function Mshop() {
    const [showHistory, setShowHistory] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [diaryIndex, setDiaryIndex] = useState(0);

    const mileageHistory = [
        { date: "2026-09-01", type: "적립", point: "+500" },
        { date: "2026-09-05", type: "사용", point: "-1000" },
        { date: "2026-09-10", type: "적립", point: "+300" },
    ];

    const products = [
        {
            name: "네이버페이 5,000원",
            image: naverpay_5000,
            point: "5,000P",
        },
        {
            name: "네이버페이 10,000원",
            image: naverpay_10000,
            point: "10,000P",
        },
        {
            name: "스타벅스 5,000원",
            image: coffee_5000,
            point: "5,000P",
        },
        {
            name: "스타벅스 10,000원",
            image: coffee_10000,
            point: "10,000P",
        },
        {
            name: "GS25 5,000원",
            image: gs25_5000,
            point: "5,000P",
        },
        {
            name: "GS25 10,000원",
            image: gs25_10000,
            point: "10,000P",
        },
        {
            name: "배달의민족 5,000원",
            image: baemin_5000,
            point: "5,000P",
        },
        {
            name: "배달의민족 10,000원",
            image: baemin_10000,
            point: "10,000P",
        },
        {
            name: "Feely Diary",
            image: Feely_Diary,
            point: "20,000P",
        }
    ];
    return (
        <div className="flex max-w-7xl mx-auto py-4 px-2 sm:px-6 gap-8 min-h-[750px]">
            <main className="flex-1">

                {/* 상단 마일리지 영역 */}
                <div className="border rounded-xl p-6 mb-8">
                    <div className="grid grid-cols-2 divide-x">

                        {/* 보유 마일리지 */}
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">보유 마일리지</p>
                            <p className="text-3xl font-bold text-[#1F6170]">
                                12,500 P
                            </p>
                        </div>

                        {/* 마일리지 내역 */}
                        <div className="text-center">
                            <p className="text-gray-500 mb-4">마일리지 내역</p>

                            <button
                                onClick={() => setShowHistory(true)}
                                className="w-24 h-9 bg-[#1F6170] text-white px-3 py-1 rounded-lg flex items-center justify-center mx-auto"
                            >
                                내역 보기
                            </button>
                        </div>

                    </div>
                </div>

                {/* 마일리지 안내 */}
                <div className="mb-8 p-4 bg-gray-50 border rounded-lg text-sm text-gray-600 leading-7">
                    <p>• 마일리지는 하루에 한 번, 상담 종료 후 자동 적립됩니다.</p>
                    <p>• 적립 내역은 마일리지 내역을 통해 확인 가능합니다.</p>
                    <p>• 교환한 마일리지는 환불되지 않으니 교환 전 핸드폰 번호를 꼭 확인하세요.</p>
                    <p>• 유효기간 연장은 불가능합니다.</p>
                    <p>• 마일리지를 현금으로 교환할 수 없습니다.</p>
                </div>

                {/* 상품권 목록 */}
                <div className="border rounded-xl overflow-hidden">
                    <div className = "grid grid-cols-4 items-start">

                   {products.map((item, idx) => {

    // Feely Diary
    if (item.name === "Feely Diary") {
        return (
            <React.Fragment key={idx}>

                {/* 다이어리 이미지 : 3칸 */}
<div className="col-span-3 h-[350px] p-0 m-0 border-b border-gray-200 overflow-hidden relative">

    {/* 이미지 */}
    <img
        src={diaryImages[diaryIndex]}
        alt={item.name}
        className="w-full h-full block object-cover"
    />

    {/* 왼쪽 화살표 */}
    <button
    onClick={() =>
        setDiaryIndex(
            diaryIndex === 0
                ? diaryImages.length - 1
                : diaryIndex - 1
        )
    }
    className="absolute left-3 top-1/2 -translate-y-1/2
               w-7 h-7 rounded-full
               bg-white/70
               hover:bg-white transition
               flex items-center justify-center"
>
    <span className="relative -left-[1px] -top-[2px]
                     text-xl font-light text-gray-500
                     leading-none">
        ‹
    </span>
</button>
    

    {/* 오른쪽 화살표 */}
    <button
    onClick={() =>
        setDiaryIndex(
            diaryIndex === diaryImages.length - 1
                ? 0
                : diaryIndex + 1
        )
    }
    className="absolute right-3 top-1/2 -translate-y-1/2
               w-7 h-7 rounded-full
               bg-white/70
               hover:bg-white transition
               flex items-center justify-center"
>
    <span className="relative left-[1px] -top-[2px]
                     text-xl font-light text-gray-500
                     leading-none">
        ›
    </span>
</button>

</div>

     {/* 다이어리 상품정보 : 1칸 */}
<div className="col-span-1 h-[350px] p-4 pt-9 border-b border-gray-200">

    {/* 상품명 + 가격 */}
    <div className="w-full text-center">
        <p className="font-semibold">
            {item.name}
        </p>

        <p className="text-[#1F6170] font-bold mt-1">
            20,000P
        </p>
    </div>

    {/* 교환 옵션 */}
    <div className="w-full mt-8">

        {/* 일기형 */}
        <div className="flex flex-col items-center mb-5">
            <p className="text-sm text-gray-500 text-center mb-2">
                하루의 마무리
            </p>

            <button
                onClick={() =>
                    setSelectedProduct({
                        ...item,
                        name: "Feely Diary - 일기형",
                        point: "20,000P"
                    })
                }
                className="w-[120px] bg-[#1F6170] text-white py-2 rounded-lg text-center"
            >
                일기형
            </button>
        </div>

        {/* 추억형 */}
        <div className="flex flex-col items-center">
            <p className="text-sm text-gray-500 text-center mb-2">
                상담기록
            </p>

            <button
                onClick={() =>
                    setSelectedProduct({
                        ...item,
                        name: "Feely Diary - 추억형",
                        point: "20,000P"
                    })
                }
                className="w-[120px] bg-[#1F6170] text-white py-2 rounded-lg text-center"
            >
                추억형
            </button>
        </div>

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
                p-4
                flex flex-col items-center
                border-b border-gray-200
                ${idx % 4 !== 3 ? "border-r border-gray-200" : ""}
            `}
        >

            <img
                src={item.image}
                alt={item.name}
                className="w-full h-40 object-contain"
            />

            <p className="font-semibold mt-3 text-center">
                {item.name}
            </p>

            <p className="text-[#1F6170] font-bold text-center mt-2">
                {item.point}
            </p>

            <button
                onClick={() => setSelectedProduct(item)}
                className="w-full mt-3 bg-[#1F6170] text-white py-2 rounded-lg"
            >
                교환하기
            </button>

        </div>
    );
})}
                </div>
                </div>
                

                {/* 마일리지 내역 모달 */}
                {showHistory && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

                        <div className="bg-white rounded-xl p-6 w-[500px]">

                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold">
                                    마일리지 내역
                                </h2>

                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <table className="w-full text-center border">
                                <thead>
                                    <tr className="border-b bg-gray-100">
                                        <th className="py-2">날짜</th>
                                        <th>구분</th>
                                        <th>포인트</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {mileageHistory.map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="py-2">{item.date}</td>
                                            <td>{item.type}</td>
                                            <td>{item.point}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>

                    </div>
                )}
                {/* 상품 교환 확인 모달 */}
{selectedProduct && (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

        <div className="bg-white rounded-xl p-6 w-[450px] shadow-lg">

            {/* 제목 */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                    상품 교환
                </h2>

                <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-xl text-gray-500"
                >
                    ✕
                </button>
            </div>

            {/* 안내 문구 */}
            <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-2">
                    해당 상품으로 교환하시겠습니까?
                </p>

                <p className="text-[#1F6170] font-bold mb-3">
                    {selectedProduct.name}
                </p>

                <p className="text-sm text-gray-500">
                    교환한 마일리지는 환불되지않습니다.<br />
                    교환한 상품은 등록하신 핸드폰번호로 발송됩니다.
                </p>
            </div>

            {/* 마일리지 정보 */}
            <div className="border rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-3">
                    <span className="text-gray-500">
                        보유마일리지
                    </span>

                    <span className="font-bold">
                        12,500 P
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-500">
                        상품가격
                    </span>

                    <span className="font-bold text-[#1F6170]">
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
                className="w-full bg-[#1F6170] text-white py-3 rounded-lg font-semibold"
            >
                교환하기
            </button>

        </div>

    </div>
)}

            </main>
        </div>
    
    );
}