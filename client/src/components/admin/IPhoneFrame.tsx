import { type ReactNode, useState, useEffect, useRef } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

const IPHONE_WIDTH = 430;
const IPHONE_HEIGHT = 932;

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
      
      const scaleX = availableWidth / IPHONE_WIDTH;
      const scaleY = availableHeight / IPHONE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale > 0.5 ? newScale : 0.5);
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative mx-auto origin-top"
      style={{ 
        width: `${IPHONE_WIDTH}px`, 
        height: `${IPHONE_HEIGHT}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top center"
      }}
    >
      <div 
        className="absolute inset-0 bg-black rounded-[60px] shadow-2xl"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 0 0 3px #1a1a1a, inset 0 0 0 4px #333"
        }}
      >
        <div 
          className="absolute top-[14px] left-[14px] right-[14px] bottom-[14px] bg-background rounded-[48px] overflow-hidden"
        >
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-b-[24px] z-50"
            style={{ 
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            <div className="absolute top-[10px] left-[36px] w-[12px] h-[12px] rounded-full bg-[#1a1a1a] border border-[#333]" />
            <div className="absolute top-[13px] right-[20px] w-[6px] h-[6px] rounded-full bg-[#0a84ff]" />
          </div>

          <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            {children}
          </div>

          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-foreground/30 rounded-full z-50" />
        </div>
      </div>

      <div className="absolute right-[-3px] top-[178px] w-[3px] h-[32px] bg-[#333] rounded-r-sm" />
      <div className="absolute left-[-3px] top-[126px] w-[3px] h-[32px] bg-[#333] rounded-l-sm" />
      <div className="absolute left-[-3px] top-[178px] w-[3px] h-[64px] bg-[#333] rounded-l-sm" />
      <div className="absolute left-[-3px] top-[254px] w-[3px] h-[64px] bg-[#333] rounded-l-sm" />
    </div>
  );
}
