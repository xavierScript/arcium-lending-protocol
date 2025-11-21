import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  href,
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#00ff9d] text-black hover:bg-[#00cc7d] shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]",
    secondary: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
    outline: "border border-[#00ff9d]/30 text-[#00ff9d] hover:bg-[#00ff9d]/10",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button 
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};
