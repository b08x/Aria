import React from 'react';
export const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}>
    <path 
        d="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75a1.125 1.125 0 01-1.125 1.125H4.125A1.125 1.125 0 013 19.875v-6.75z" />
    <path 
        d="M12 3v10.25a.75.75 0 01-1.06.638l-4.5-2.25a.75.75 0 010-1.275l4.5-2.25A.75.75 0 0112 3z" />
    <path
      d="M12 3v10.25a.75.75 0 001.06.638l4.5-2.25a.75.75 0 000-1.275l-4.5-2.25A.75.75 0 0012 3z" />
  </svg>
);
