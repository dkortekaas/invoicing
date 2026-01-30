import Link from "next/link";

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  return (
    <Link href="/" className={`flex items-center gap-0.5 ${className}`}>
      <span className="text-2xl font-bold text-foreground tracking-tight">
        declair
      </span>
      <span className="w-2 h-2 rounded-full bg-primary mb-0.5" />
    </Link>
  );
};

export default Logo;