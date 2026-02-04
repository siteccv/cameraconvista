import { type ReactNode, useState, useEffect, useRef } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

const IPHONE_15_PRO_WIDTH = 393;
// iPhone 15 Pro logical height is 852px, but we subtract status bar (~47px) 
// and home indicator (~34px) to show realistic visible content area
const IPHONE_15_PRO_HEIGHT = 771; // 852 - 47 - 34 = 771

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(IPHONE_15_PRO_HEIGHT);

  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      
      const availableHeight = parent.clientHeight - 32;
      setContainerHeight(Math.min(availableHeight, IPHONE_15_PRO_HEIGHT));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex justify-center w-full h-full p-4"
    >
      <div
        className="bg-background border border-border rounded-xl shadow-xl overflow-hidden"
        style={{
          width: `${IPHONE_15_PRO_WIDTH}px`,
          height: `${containerHeight}px`,
          minHeight: "600px",
        }}
      >
        <div 
          className="h-full overflow-y-auto overflow-x-hidden"
          style={{ width: `${IPHONE_15_PRO_WIDTH}px` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
