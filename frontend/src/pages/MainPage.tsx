import { useRef, useEffect } from "react";
import cam from "../assets/cam.webm";
// import face from "../assets/face.webm";
// import chat from "../assets/chat.webm";
// import text2 from "../assets/2_text.png";
// import text3 from "../assets/3_2text.png";
import main2 from "../assets/main3.mp4"
import main_last from "../assets/main_last.mp4";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

export default function MainPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const camRef = useRef<HTMLVideoElement>(null);
  // const faceRef = useRef<HTMLVideoElement>(null);
  const main2Ref = useRef<HTMLVideoElement>(null);
  // const chatRef = useRef<HTMLVideoElement>(null);
  const mainLastRef = useRef<HTMLVideoElement>(null);

  // 현재 화면
  // 0 = 1번
  // 1 = 2번
  // 2 = 3번
  const activeScreenRef = useRef(0);

  // 역재생 기능은 사용하지 않음
  // const reverseAnimationRef = useRef<number | null>(null);

  // 1번 영상의 4초 대기 타이머
  const camRestartTimerRef = useRef<number | null>(null);

  /* ==================================================
     1번 영상 무한 반복
     영상 종료
     → 4초 대기
     → 처음부터 재생
     ================================================== */

  const startCamLoop = () => {
    const video = camRef.current;

    if (!video) return;

    // 기존 타이머 제거
    if (camRestartTimerRef.current !== null) {
      window.clearTimeout(camRestartTimerRef.current);
      camRestartTimerRef.current = null;
    }

    // 영상 처음으로
    video.currentTime = 0;
    video.playbackRate = 1;

    video.play().catch(() => {
      // 브라우저 자동재생 제한 방지
    });
  };

  const scheduleCamRestart = () => {
    // 기존 타이머가 있다면 제거
    if (camRestartTimerRef.current !== null) {
      window.clearTimeout(camRestartTimerRef.current);
      camRestartTimerRef.current = null;
    }

    // 영상 종료 후 4초 대기
    camRestartTimerRef.current = window.setTimeout(() => {
      camRestartTimerRef.current = null;

      // 현재 1번 화면일 때만 다시 재생
      if (activeScreenRef.current === 0) {
        startCamLoop();
      }
    }, 4000);
  };

  /* ==================================================
     영상 속도 설정
     ================================================== */

  useEffect(() => {
    const camVideo = camRef.current;

    /* ==================================================
       1번 영상
       영상이 끝나면 4초 기다린 후 다시 재생
       ================================================== */

    if (camVideo) {
      camVideo.playbackRate = 1;

      const handleCamEnded = () => {
        // 현재 1번 화면일 때만 4초 후 재생
        if (activeScreenRef.current === 0) {
          scheduleCamRestart();
        }
      };

      camVideo.addEventListener("ended", handleCamEnded);

      const playCam = () => {
        startCamLoop();
      };

      // 이미 영상 데이터가 준비되어 있으면 바로 재생
      if (camVideo.readyState >= 2) {
        playCam();
      } else {
        // 영상이 준비된 후 재생
        camVideo.addEventListener(
          "loadeddata",
          playCam,
          { once: true }
        );
      }

      // 컴포넌트 제거 시 이벤트 정리
      return () => {
        camVideo.removeEventListener(
          "ended",
          handleCamEnded
        );

        if (camRestartTimerRef.current !== null) {
          window.clearTimeout(camRestartTimerRef.current);
          camRestartTimerRef.current = null;
        }

        /*
        if (reverseAnimationRef.current !== null) {
          cancelAnimationFrame(
            reverseAnimationRef.current
          );

          reverseAnimationRef.current = null;
        }
        */
      };
    }

    /* ==================================================
       컴포넌트 제거 시 역재생 정리
       ================================================== */

    return () => {
      /*
      if (reverseAnimationRef.current !== null) {
        cancelAnimationFrame(
          reverseAnimationRef.current
        );

        reverseAnimationRef.current = null;
      }
      */

      if (camRestartTimerRef.current !== null) {
        window.clearTimeout(camRestartTimerRef.current);
        camRestartTimerRef.current = null;
      }
    };
  }, []);

  /* ==================================================
     2번 영상
     ================================================== */

  useEffect(() => {
    /*
    if (faceRef.current) {
      faceRef.current.playbackRate = 0.5;
    }
    */

    if (main2Ref.current) {
      main2Ref.current.playbackRate = 1;
    }

    if (mainLastRef.current) {
      mainLastRef.current.playbackRate = 1;
    }
  }, []);

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
    [0.10, 0.25],
    ["100%", "0%"]
  );

  /* ==================================================
     2번 화면
     충분히 보여준 뒤 왼쪽으로 밀려남
     ================================================== */

  const secondX = useTransform(
    scrollYProgress,
    [0.60, 0.75],
    ["0%", "-100%"]
  );

  /* ==================================================
     3번 화면
     오른쪽에서 왼쪽으로 들어옴
     ================================================== */

  const thirdX = useTransform(
    scrollYProgress,
    [0.60, 0.75],
    ["100%", "0%"]
  );

  /* ==================================================
     모든 영상 정지
     ================================================== */

  const stopAllVideos = () => {
    if (camRef.current) {
      camRef.current.pause();
    }

    /*
    if (faceRef.current) {
      faceRef.current.pause();
    }
    */

    if (main2Ref.current) {
      main2Ref.current.pause();
    }

    if (mainLastRef.current) {
      mainLastRef.current.pause();
    }

    // 1번 영상의 4초 대기 타이머도 제거
    if (camRestartTimerRef.current !== null) {
      window.clearTimeout(camRestartTimerRef.current);
      camRestartTimerRef.current = null;
    }
  };

  //   /* ==================================================
  //      역재생 시작
  //
  //      2번 / 3번 영상에서만 사용
  //      ================================================== */
  //
  //   const startReversePlayback = (
  //     video: HTMLVideoElement,
  //     speed: number
  //   ) => {
  //     // 기존 역재생 정리
  //     if (reverseAnimationRef.current !== null) {
  //       cancelAnimationFrame(
  //         reverseAnimationRef.current
  //       );
  //
  //       reverseAnimationRef.current = null;
  //     }
  //
  //     video.pause();
  //
  //     // 영상 정보가 아직 준비되지 않은 경우
  //     if (
  //       !Number.isFinite(video.duration) ||
  //       video.duration <= 0
  //     ) {
  //       const handleLoadedMetadata = () => {
  //         startReversePlayback(video, speed);
  //       };
  //
  //       video.addEventListener(
  //         "loadedmetadata",
  //         handleLoadedMetadata,
  //         { once: true }
  //       );
  //
  //       return;
  //     }
  //
  //     // 영상 마지막에서 시작
  //     video.currentTime = video.duration;
  //
  //     let previousTime = performance.now();
  //
  //     const reverseFrame = (currentTime: number) => {
  //       const elapsed =
  //         (currentTime - previousTime) / 1000;
  //
  //       previousTime = currentTime;
  //
  //       // 역재생 속도
  //       video.currentTime = Math.max(
  //         0,
  //         video.currentTime - elapsed * speed
  //       );
  //
  //       // 영상 처음까지 도착하면 정지
  //       if (video.currentTime <= 0.01) {
  //         video.currentTime = 0;
  //         reverseAnimationRef.current = null;
  //         return;
  //       }
  //
  //       reverseAnimationRef.current =
  //         requestAnimationFrame(reverseFrame);
  //     };
  //
  //     reverseAnimationRef.current =
  //       requestAnimationFrame(reverseFrame);
  //   };

  /* ==================================================
     화면 전환 + 영상 방향 제어

     아래/위로 이동
     → 2번 / 3번 영상 모두 처음부터 정방향 재생

     1번 영상은 역재생하지 않음
     → 다시 1번으로 돌아오면 무한 반복 시작
     ================================================== */

  useMotionValueEvent(
    scrollYProgress,
    "change",
    (latest) => {
      const previousScreen =
        activeScreenRef.current;

      let nextScreen = 0;

      /*
       * 0 ~ 0.25
       * 1번 화면
       *
       * 0.25 ~ 0.75
       * 2번 화면
       *
       * 0.75 ~ 1
       * 3번 화면
       */

      if (latest < 0.25) {
        nextScreen = 0;
      } else if (latest < 0.75) {
        nextScreen = 1;
      } else {
        nextScreen = 2;
      }

      // 같은 화면이면 영상 상태를 건드리지 않음
      if (nextScreen === previousScreen) {
        return;
      }

      // 기존 역재생 취소
      /*
      if (reverseAnimationRef.current !== null) {
        cancelAnimationFrame(
          reverseAnimationRef.current
        );

        reverseAnimationRef.current = null;
      }
      */

      // 기존 영상 정지
      stopAllVideos();

      let nextVideo: HTMLVideoElement | null = null;

      if (nextScreen === 0) {
        nextVideo = camRef.current;
      } else if (nextScreen === 1) {
        /* 기존 2번 영상(face.webm) 연결은 삭제하지 않고 주석 처리
        nextVideo = faceRef.current;
        */
        nextVideo = main2Ref.current;
      } else if (nextScreen === 2) {
        // 기존 3번 영상(chat.webm) 연결은 삭제하지 않고 주석 처리
        /*
        nextVideo = chatRef.current;
        */
        nextVideo = mainLastRef.current;
      }

      if (!nextVideo) {
        activeScreenRef.current = nextScreen;
        return;
      }

      /* ==================================================
         화면 전환 시 영상 재생

         1 → 2 → 3
         3 → 2 → 1

         2번 / 3번 영상은 역재생하지 않음
         → 어느 방향으로 이동하더라도 처음부터 정방향 재생
         ================================================== */

      if (nextScreen === 0) {
        activeScreenRef.current = nextScreen;
        startCamLoop();
        return;
      }

      nextVideo.currentTime = 0;
      nextVideo.playbackRate = 1;

      nextVideo.play().catch(() => {
        // 브라우저 자동재생 제한 방지
      });

      activeScreenRef.current = nextScreen;
    }
  );

  return (
    <div className="w-full bg-white">
      {/* ==================================================
          스크롤 공간
          800vh
          ================================================== */}

      <section
        ref={containerRef}
        className="relative h-[800vh]"
      >
        {/* ==================================================
            화면 고정 영역
            ================================================== */}

        <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden">

          {/* ==================================================
              1번 영상
              cam.webm
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
            <video
              ref={camRef}
              src={cam}
              muted
              playsInline
              preload="auto"
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
              기존 face.webm 화면은 삭제하지 않고 주석 처리
              → main2.mp4 전체 화면으로 변경
              ================================================== */}

          {/*
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
            <div className="w-full h-full flex">
              <div className="relative w-1/2 h-full bg-white flex items-center justify-center overflow-hidden">
                <video
                  ref={faceRef}
                  src={face}
                  muted
                  playsInline
                  preload="auto"
                  className="block max-w-full max-h-full object-contain"
                />
              </div>

              <div className="relative w-1/2 h-full bg-black overflow-hidden">
                <img
                  src={text2}
                  alt="Feely 소개 문구"
                  className="absolute left-5 bottom-5 max-w-[80%] max-h-[35%] object-contain"
                />
              </div>
            </div>
          </motion.div>
          */}

          {/* ==================================================
              2번 화면 - main2.mp4
              화면 전체를 채우고 비율은 유지
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
            <video
              ref={main2Ref}
              src={main2}
              muted
              playsInline
              preload="auto"
              className="block w-full h-full object-cover"
            />
          </motion.div>

          {/* ==================================================
              기존 3번 화면 코드는 삭제하지 않고 아래에 전부 주석 처리
              ==================================================

          {/ * ==================================================
              3번 화면
              왼쪽 검정 / 오른쪽 chat.webm
              ================================================== * /}

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

              {/ * 3번 왼쪽 50% * /}

              <div
                className="
                  relative
                  w-1/2
                  h-full
                  bg-black
                  overflow-hidden
                "
              >
                <img
                  src={text3}
                  alt="Feely 상담 소개 문구"
                  className="
                    absolute
                    right-5
                    bottom-5
                    max-w-[80%]
                    max-h-[35%]
                    object-contain
                  "
                />
              </div>

              {/ * 3번 오른쪽 50% * /}

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
                <video
                  ref={chatRef}
                  src={chat}
                  muted
                  playsInline
                  preload="auto"
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
          */}


          {/* ==================================================
              3번 화면 - main_last.mp4
              기존 3번 화면은 위에서 전체 주석 처리
              2번과 동일하게 화면 영역을 가득 채우고
              원본 비율을 유지
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
            <video
              ref={mainLastRef}
              src={main_last}
              muted
              playsInline
              preload="auto"
              className="block w-full h-full object-cover"
            />
          </motion.div>

        </div>
      </section>
    </div>
  );
}