import { cn } from "@/lib/utils";

interface PumpIconProps {
  tagNumber: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

const PumpIcon = ({ tagNumber, description, className, onClick }: PumpIconProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex flex-col items-center justify-center px-8 py-3 rounded-2xl",
        "bg-[#0052CC] border-4 border-[#003D99]",
        "cursor-pointer transition-all duration-200",
        "hover:bg-[#0066FF] hover:border-[#004DBF] hover:shadow-lg",
        "active:scale-95",
        className
      )}
    >
      <span className="text-white font-bold text-sm tracking-wide">
        {tagNumber}
      </span>
      <span className="text-white font-bold text-sm tracking-wide">
        {description}
      </span>
    </div>
  );
};

export default PumpIcon;
