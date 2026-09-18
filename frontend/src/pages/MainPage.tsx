import { useRef } from "react";
import Cam from "../assets/Cam.png";
import face_1 from "../assets/face_1.png";
import CounselImg_2 from "../assets/CounselImg_2.png"; 
import EmotionCalender from "../assets/EmotionCalender.png" 
import Report from "../assets/Report.png"

import { motion, useScroll, useTransform } from "framer-motion";

export default function MainPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* ==================================================
     2번 화면
     아래에서 위로 올라옴
     ================================================== */

  const secondY = useTransform(
    scrollYProgress,
    [0, 0.18, 0.35],
    ["100%", "100%", "0%"]
  );

  /* ==================================================
     2번 face_1 크기 모션
     ================================================== */

  const faceScale = useTransform(
    scrollYProgress,
    [0.35, 0.50],
    [0.8, 1]
  );

  /* ==================================================
     2번 화면
     왼쪽으로 밀려남

     전환 속도 느리게
     ================================================== */

  const secondX = useTransform(
    scrollYProgress,
    [0.55, 0.80],
    ["0%", "-100%"]
  );

  /* ==================================================
     3번 CounselImg_2
     오른쪽에서 왼쪽으로 들어옴

     전환 속도 느리게
     ================================================== */

  const thirdX = useTransform(
    scrollYProgress,
    [0.55, 0.80],
    ["100%", "0%"]
  );

  return (
    <div className="w-full bg-white">

      {/* ==================================================
          스크롤 공간
          ================================================== */}
      <section
        ref={containerRef}
        className="relative h-[500vh]"
      >

        {/* ==================================================
            화면 고정 영역
            ================================================== */}
        <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden">


          {/* ==================================================
              1번 이미지
              ================================================== */}
          <div
            className="
              absolute
              top-0
              left-0
              w-screen
              h-screen
              z-10
              bg-black
              overflow-hidden
            "
          >
            <img
              src={Cam}
              alt="Feely 카메라"
              className="
                block
                w-screen
                h-screen
                object-cover
              "
            />
          </div>


          {/* ==================================================
              2번 화면
              아래에서 올라온 후 왼쪽으로 밀림
              ================================================== */}
          <motion.div
            style={{
              y: secondY,
              x: secondX,
            }}
            className="
              absolute
              top-[70px]
              left-0
              w-screen
              h-[calc(100vh-70px)]
              z-20
              bg-black
              overflow-hidden
            "
          >

            <div
              className="
                w-full
                h-full
                flex
              "
            >

              {/* 2번 왼쪽 50% */}
              <div
                className="
                  relative
                  w-1/2
                  h-full
                  bg-white
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                "
              >

                <motion.img
                  src={face_1}
                  alt="얼굴 이미지"
                  style={{
                    scale: faceScale,
                  }}
                  className="
                    block
                    max-w-[80%]
                    max-h-[80%]
                    object-contain
                  "
                />

              </div>


              {/* 2번 오른쪽 50% */}
              <div
                className="
                  w-1/2
                  h-full
                  bg-black
                "
              />

            </div>

          </motion.div>


          {/* ==================================================
              3번 CounselImg_2
              왼쪽 검정 / 오른쪽 이미지
              ================================================== */}
          <motion.div
            style={{
              x: thirdX,
            }}
            className="
              absolute
              top-[70px]
              left-0
              w-screen
              h-[calc(100vh-70px)]
              z-30
              bg-black
              overflow-hidden
            "
          >

            <div
              className="
                w-full
                h-full
                flex
              "
            >

              {/* 3번 왼쪽 50% */}
              <div
                className="
                  w-1/2
                  h-full
                  bg-black
                "
              />


              {/* 3번 오른쪽 50% */}
              <div
                className="
                  w-1/2
                  h-full
                  bg-white
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                "
              >

                <img
                  src={CounselImg_2}
                  alt="AI 상담 화면"
                  className="
                    block
                    max-w-full
                    max-h-full
                    object-contain
                  "
                />

              </div>

            </div>

          </motion.div>


        </div>

      </section>

    </div>
  );
}