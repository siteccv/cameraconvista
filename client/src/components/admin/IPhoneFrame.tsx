import { type ReactNode, useState, useEffect, useRef } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

const IPHONE_WIDTH = 430;
const IPHONE_HEIGHT = 932;
const BEZEL = 14;
const CORNER_RADIUS = 60;
const INNER_CORNER_RADIUS = 48;

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      
      const availableHeight = parent.clientHeight - 40;
      const availableWidth = parent.clientWidth - 40;
      
      const scaleX = availableWidth / IPHONE_WIDTH;
      const scaleY = availableHeight / IPHONE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(Math.max(newScale, 0.4));
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  const contentWidth = IPHONE_WIDTH - (BEZEL * 2);
  const contentHeight = IPHONE_HEIGHT - (BEZEL * 2);

  return (
    <div 
      ref={containerRef}
      className="flex items-start justify-center w-full h-full overflow-hidden"
    >
      <div
        className="origin-top"
        style={{
          transform: `scale(${scale})`,
          width: `${IPHONE_WIDTH}px`,
          height: `${IPHONE_HEIGHT}px`,
          flexShrink: 0,
        }}
      >
        <div 
          className="relative w-full h-full bg-black shadow-2xl"
          style={{
            borderRadius: `${CORNER_RADIUS}px`,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 0 0 3px #1a1a1a, inset 0 0 0 4px #333"
          }}
        >
          <div 
            className="absolute bg-background"
            style={{
              top: `${BEZEL}px`,
              left: `${BEZEL}px`,
              width: `${contentWidth}px`,
              height: `${contentHeight}px`,
              borderRadius: `${INNER_CORNER_RADIUS}px`,
              overflow: "hidden",
            }}
          >
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black z-50"
              style={{ 
                borderRadius: "0 0 24px 24px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
              }}
            >
              <div className="absolute top-[10px] left-[36px] w-[12px] h-[12px] rounded-full bg-[#1a1a1a] border border-[#333]" />
              <div className="absolute top-[13px] right-[20px] w-[6px] h-[6px] rounded-full bg-[#0a84ff]" />
            </div>

            <div 
              className="w-full h-full overflow-y-auto overflow-x-hidden"
              style={{ 
                borderRadius: `${INNER_CORNER_RADIUS}px`,
              }}
            >
              {children}
            </div>

            <div 
              className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-foreground/30 rounded-full z-50 pointer-events-none" 
            />
          </div>

          <div className="absolute right-[-3px] top-[178px] w-[3px] h-[32px] bg-[#333] rounded-r-sm" />
          <div className="absolute left-[-3px] top-[126px] w-[3px] h-[32px] bg-[#333] rounded-l-sm" />
          <div className="absolute left-[-3px] top-[178px] w-[3px] h-[64px] bg-[#333] rounded-l-sm" />
          <div className="absolute left-[-3px] top-[254px] w-[3px] h-[64px] bg-[#333] rounded-l-sm" />
        </div>
      </div>
    </div>
  );
}
