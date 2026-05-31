import React from 'react';

type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'body' 
  | 'body-sm' 
  | 'caption' 
  | 'label'
  | 'admin-h1'
  | 'admin-h2'
  | 'admin-h3'
  | 'admin-body'
  | 'admin-caption';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

export function Typography({ 
  variant = 'body', 
  as, 
  className = '', 
  children, 
  ...props 
}: TypographyProps) {
  
  const variantStyles: Record<TypographyVariant, string> = {
    h1: 'text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight',
    h2: 'text-xl md:text-2xl font-bold text-gray-800 tracking-tight leading-snug',
    h3: 'text-lg font-semibold text-gray-900 leading-normal',
    h4: 'text-base font-semibold text-gray-800 leading-normal',
    body: 'text-base font-normal text-gray-600 leading-relaxed',
    'body-sm': 'text-sm font-normal text-gray-500 leading-relaxed',
    caption: 'text-xs text-gray-500 leading-normal font-medium',
    label: 'text-sm font-medium text-gray-700 select-none',
    
    // Admin dashboard specific typographies that map to the new custom tailwind token scales
    'admin-h1': 'text-admin-2xl font-black text-slate-800 tracking-tight leading-tight',
    'admin-h2': 'text-admin-xl font-extrabold text-slate-800 tracking-tight leading-snug',
    'admin-h3': 'text-admin-lg font-bold text-slate-800 leading-normal',
    'admin-body': 'text-admin-base font-medium text-slate-600 leading-relaxed',
    'admin-caption': 'text-admin-xs font-bold text-slate-400 uppercase tracking-wider',
  };

  // Determine the HTML element to render
  const defaultElements: Record<TypographyVariant, React.ElementType> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    body: 'p',
    'body-sm': 'p',
    caption: 'span',
    label: 'label',
    'admin-h1': 'h1',
    'admin-h2': 'h2',
    'admin-h3': 'h3',
    'admin-body': 'p',
    'admin-caption': 'span',
  };

  const Component = as || defaultElements[variant] || 'p';

  return (
    <Component 
      className={`${variantStyles[variant]} ${className}`} 
      {...props}
    >
      {children}
    </Component>
  );
}
