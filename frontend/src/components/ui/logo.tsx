import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export function Logo({ size = 28, className = "", showText = true, textSize = "text-[14px]" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative overflow-hidden rounded-lg border border-[#243556] bg-[#080D1C] shadow-sm shrink-0 transition-transform group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Smart Study Logo"
          width={size * 2}
          height={size * 2}
          className="object-cover w-full h-full"
          priority
        />
      </div>
      {showText && (
        <span className={`${textSize} font-heading font-bold tracking-tight text-[#F4F7FF]`}>
          Smart Study
        </span>
      )}
    </div>
  );
}
