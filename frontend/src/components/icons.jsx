/** Inline stroke icons (24px grid, 1.8 stroke) — no icon library needed. */
const paths = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  flame: <path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.2-2.1-5.4-3.6-7.3-.3 1.7-1.2 2.8-2.4 3.4.4-2.9-.9-5.8-3.5-7.9.1 2.9-1.4 4.6-2.9 6.4C4.8 11.2 5.5 13 5.5 14.8 5.5 18.4 8.1 21 12 21Z" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
  chef: <><path d="M7 14.5V20h10v-5.5" /><path d="M7 14.5a4 4 0 0 1-1-7.6 4.5 4.5 0 0 1 8.6-2.1A4 4 0 0 1 17 14.5H7Z" /></>,
  chart: <><path d="M4 20h16" /><path d="M7 16v-5M12 16V6M17 16v-8" /></>,
  table: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M10 10v9" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" /></>,
  message: <path d="M5 5h14v10H9l-4 4V5Z" />,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  sparkle: <path d="M12 3c.6 4.2 2.2 6.4 6.5 7-4.3.7-5.9 2.8-6.5 7-.6-4.2-2.2-6.3-6.5-7 4.3-.6 5.9-2.8 6.5-7ZM19 16c.3 1.6.9 2.4 2.5 2.7-1.6.3-2.2 1.1-2.5 2.7-.3-1.6-.9-2.4-2.5-2.7 1.6-.3 2.2-1.1 2.5-2.7Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  print: <><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v6H7z" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
  card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  cash: <><rect x="3" y="7" width="18" height="10" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  refresh: <path d="M19 12a7 7 0 1 1-2-4.9M19 4v4h-4" />,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  leaf: <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0 6-6" />,
};

export function Icon({ name, size = 20, className, strokeWidth = 1.8, fill = "none", title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
