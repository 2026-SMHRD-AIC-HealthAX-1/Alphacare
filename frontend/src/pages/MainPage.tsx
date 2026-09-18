import { useRef } from 'react';
import Cam from "../assets/Cam.png"
import CounselImg from "../assets/CounselImg.png"
import { motion, useScroll, useTransform } from 'framer-motion';




 export default function MainPage() {
  return (
    <div className="relative left-1/2 -translate-x-1/2 w-[100vw] h-screen -mt-[1px] bg-black overflow-hidden">
      <img
        src={Cam}
        alt="Feely 메인 이미지"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}