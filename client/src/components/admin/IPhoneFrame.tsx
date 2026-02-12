import { type ReactNode, useRef, useState, useEffect, useCallback } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

const IPHONE_WIDTH = 393;
const IPHONE_HEIGHT = 852;
const BEZEL = 12;
const DEVICE_WIDTH = IPHONE_WIDTH + BEZEL * 2;
const DEVICE_HEIGHT = IPHONE_HEIGHT + BEZEL * 2;

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  const updateScale = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const parent = wrapper.parentElement;
    if (!parent) return;
    const style = getComputedStyle(parent);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const availW = parent.clientWidth - paddingX;
    const availH = parent.clientHeight - paddingY;
    if (availW <= 0 || availH <= 0) return;
    const s = Math.min(availW / DEVICE_WIDTH, availH / DEVICE_HEIGHT, 1);
    setScale(s);
  }, []);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (wrapperRef.current?.parentElement) {
      ro.observe(wrapperRef.current.parentElement);
    }
    return () => ro.disconnect();
  }, [updateScale]);

  const displayW = DEVICE_WIDTH * scale;
  const displayH = DEVICE_HEIGHT * scale;

  return (
    <div
      ref={wrapperRef}
      style={{
        width: displayW,
        height: displayH,
        position: "relative",
        visibility: scale === 0 ? "hidden" : "visible",
      }}
    >
      <div
        className="bg-black rounded-[3rem] shadow-xl flex-shrink-0"
        style={{
          width: DEVICE_WIDTH,
          height: DEVICE_HEIGHT,
          padding: BEZEL,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div className="bg-background rounded-[2rem] overflow-hidden w-full h-full">
          <div
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ width: IPHONE_WIDTH }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
