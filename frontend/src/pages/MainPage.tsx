import { useRef } from 'react';
import mainimg from "../assets/Main.png"
import { motion, useScroll, useTransform } from 'framer-motion';


export default function MainPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // 스크롤 진행도 추적 (0 ~ 1)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // 스크롤에 따라 이미지 확대 (1배 -> 3.2배)
  const scale = useTransform(scrollYProgress, [0, 1], [1, 6]);
  
  // 스크롤이 끝날 때 배경 및 텍스트 투명도 조절
  const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);

  return (
    <div className="w-full bg-white">
      {/* 스크롤 영역 확보 (300vh로 스크롤 길이를 지정) */}
      <div ref={containerRef} className="relative h-[700vh]">
        
        {/* 화면에 고정되는 뷰포트 영역 */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* 스크롤에 맞춰 줌인되는 이미지 컨테이너 */}
          <motion.div
            style={{
              scale,
              // 이미지 내 노트북 화면의 중심점 좌표 (X: 52%, Y: 62%)
              transformOrigin: "52% 70%",
            }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* 메인 이미지 */}
            <img
              src={mainimg} // 실제 이미지 경로 입력
              alt="Feely 메인 히어로 이미지"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* 안내 캡션 (스크롤 내릴수록 사라짐) */}
          <motion.div
            style={{ opacity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-500 pointer-events-none"
          >
            <span className="text-sm font-medium mb-2">스크롤을 내려보세요</span>
            <div className="w-5 h-8 border-2 border-gray-400 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </motion.div>

        </div>
      </div>

            <section className="relative z-20 w-full h-screen overflow-hidden">
        <img
          src={mainimg}
          alt="Feely 두 번째 소개 이미지"
          className="w-full h-full object-cover"
        />
      </section>






      {/* 스크롤 줌인이 끝난 후 이어지는 하단 컨텐츠 영역 */}
      <section className="relative z-10 min-h-screen bg-white py-24 px-6 flex flex-col items-center justify-center border-t">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          마음이 편해지는 상담, Feely
        </h2>
        <p className="text-lg text-gray-600 max-w-xl text-center leading-relaxed">
          노트북 화면 너머로 언제나 당신의 이야기를 들을 준비가 되어 있습니다.
        </p>
      </section>
    </div>





  






  );
}