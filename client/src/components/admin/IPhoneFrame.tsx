import { type ReactNode } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="flex justify-center w-full h-full p-4">
      <div 
        className="bg-background border border-border rounded-lg shadow-lg overflow-y-auto overflow-x-hidden"
        style={{ 
          width: "390px",
          maxHeight: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
