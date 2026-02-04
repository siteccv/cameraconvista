import { type ReactNode, useState, useEffect, useRef } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

const IPHONE_15_PRO_WIDTH = 393;
const IPHONE_15_PRO_HEIGHT = 852;

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      
      const availableHeight = parent.clientHeight - 32;
      const availableWidth = parent.clientWidth - 32;
      
      const scaleX = availableWidth / IPHONE_15_PRO_WIDTH;
      const scaleY = availableHeight / IPHONE_15_PRO_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(Math.max(newScale, 0.5));
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex items-start justify-center w-full h-full overflow-hidden p-4"
    >
      <div
        className="origin-top bg-background border border-border rounded-xl shadow-xl overflow-hidden"
        style={{
          transform: `scale(${scale})`,
          width: `${IPHONE_15_PRO_WIDTH}px`,
          height: `${IPHONE_15_PRO_HEIGHT}px`,
          flexShrink: 0,
        }}
      >
        <div className="w-full h-full overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
