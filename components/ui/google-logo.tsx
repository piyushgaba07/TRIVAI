import type { HTMLAttributes } from "react"

export function GoogleLogo({ className, ...props }: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path fill="#EA4335" d="M24 9.5c3.54 0 6 1.54 7.38 2.83l5.4-5.26C33.66 3.35 29.26 1.5 24 1.5 14.78 1.5 6.88 6.91 3.17 14.44l6.7 5.2C11.64 13.59 17.27 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.21-.43-4.73H24v9.02h12.7c-.55 2.82-2.22 5.21-4.7 6.82l7.39 5.73c4.31-3.98 7.11-9.86 7.11-16.84z" />
      <path fill="#FBBC05" d="M9.87 28.76A14.33 14.33 0 0 1 9 24c0-1.65.29-3.25.8-4.75l-6.7-5.2A22.43 22.43 0 0 0 1.5 24c0 3.64.87 7.07 2.4 10.1l6.97-5.34z" />
      <path fill="#34A853" d="M24 46.5c5.94 0 10.93-1.96 14.58-5.33l-7.39-5.73c-2.03 1.36-4.63 2.15-7.19 2.15-6.73 0-12.36-4.09-14.13-9.76l-6.97 5.34C6.88 41.09 14.78 46.5 24 46.5z" />
    </svg>
  )
}

export default GoogleLogo
