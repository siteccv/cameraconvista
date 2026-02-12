import { type ReactNode } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

const IPHONE_15_PRO_WIDTH = 393;
const IPHONE_15_PRO_HEIGHT = 852;

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="flex justify-center w-full p-4">
      <div
        className="bg-background border border-border rounded-[2.5rem] shadow-xl overflow-hidden flex-shrink-0"
        style={{
          width: `${IPHONE_15_PRO_WIDTH}px`,
          height: `${IPHONE_15_PRO_HEIGHT}px`,
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
