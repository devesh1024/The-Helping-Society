import logo from "@/assets/logo.png";

export const Logo = ({ className = "h-9 w-9" }: { className?: string }) => (
  <img src={logo} alt="The Helping Society logo" className={className} />
);
