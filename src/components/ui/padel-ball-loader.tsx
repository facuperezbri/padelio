"use client";

import { cn } from "@/lib/utils";

interface PadelBallLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PadelBallLoader({ className, size = "md" }: PadelBallLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <>
      <style jsx global>{`
        @keyframes padel-bounce {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(0.9);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        .padel-ball-animation {
          animation: padel-bounce 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className="relative">
          {/* Pelota de padel */}
          <div
            className={cn(
              "rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-xl",
              "border-2 border-blue-800/50",
              "padel-ball-animation",
              sizeClasses[size]
            )}
          >
            {/* Líneas características de la pelota */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-blue-800/40"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rotate-90">
              <div className="w-full h-0.5 bg-blue-800/40"></div>
            </div>
            {/* Punto central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-800/60"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

