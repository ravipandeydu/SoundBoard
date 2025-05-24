"use client";

export function AnimatedBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div className="wave-pattern"></div>
      </div>
      <style jsx global>{`
        .wave-pattern {
          background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%);
          width: 100%;
          aspect-ratio: 1;
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: center;
          transform: translate(-50%, -50%) scale(2);
          border-radius: 50%;
          animation: rotate 20s linear infinite;
          opacity: 0.1;
        }

        @keyframes rotate {
          from {
            transform: translate(-50%, -50%) scale(2) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) scale(2) rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
