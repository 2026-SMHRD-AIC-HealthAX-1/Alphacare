import React, { useState } from 'react'
import naverpay_5000 from "../../assets/naverpay_5000.png";
import naverpay_10000 from "../../assets/naverpay_10000.png";

import coffee_5000 from "../../assets/coffee_5000.png";
import coffee_10000 from "../../assets/coffee_10000.png";

import gs25_5000 from "../../assets/gs25_5000.png";
import gs25_10000 from "../../assets/gs25_10000.png";

import baemin_5000 from "../../assets/baemin_5000.png";
import baemin_10000 from "../../assets/baemin_10000.png";


{/* 보유 마일리지, 적립내역 회원번호와 연동필요, 금액권 재고 연동 필요, 금액권 교환 후 마일리지 차감내역 확인필요 */}

export default function Mshop() {
    const [showHistory, setShowHistory] = useState(false);

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
                    <div className = "grid grid-cols-4">

                    {products.map((item, idx) => (
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
                                className="w-full mt-3 bg-[#1F6170] text-white py-2 rounded-lg"
                            >
                                교환하기
                            </button>
                            </div>
                        
                    ))}
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

            </main>
        </div>
    
    );
}