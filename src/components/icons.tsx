import type { SVGProps } from 'react';

export function KotelaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6.5 6.5l8 -2.5" />
      <path d="M6.5 17.5l8 2.5" />
      <path d="M14.5 4l-8 8" />
      <path d="M6.5 12l8 8" />
    </svg>
  );
}
