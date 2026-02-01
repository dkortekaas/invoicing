import Link from "next/link";

interface LogoProps {
  className?: string;
  /** When false, renders a span instead of a link (use when Logo is inside another link, e.g. sidebar). */
  asLink?: boolean;
}

const logoContent = (
  <>
    <span className="text-2xl font-bold text-foreground tracking-tight">
      declair
    </span>
    <span className="w-2 h-2 rounded-full bg-primary mb-0.5" />
  </>
);

const Logo = ({ className = "", asLink = true }: LogoProps) => {
  const baseClassName = `flex items-center gap-0.5 ${className}`;
  if (!asLink) {
    return <span className={baseClassName}>{logoContent}</span>;
  }
  return (
    <Link href="/" className={baseClassName}>
      {logoContent}
    </Link>
  );
};

export default Logo;