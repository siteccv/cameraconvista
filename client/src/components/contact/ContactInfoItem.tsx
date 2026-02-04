import { LucideIcon } from "lucide-react";

interface ContactInfoItemProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  testId?: string;
}

export function ContactInfoItem({ icon: Icon, title, children, testId }: ContactInfoItemProps) {
  return (
    <div className="flex items-start gap-4" data-testid={testId}>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        {children}
      </div>
    </div>
  );
}
