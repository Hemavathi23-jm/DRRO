/**
 * Shared SVG icons — use these instead of emoji anywhere in the UI.
 */
export default function Icon({ name, size = 16, className = '', style, title }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: `ui-icon ${className}`.trim(),
    style,
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : undefined,
  };

  const paths = {
    alert: (
      <>
        <path d="M12 3l9 16H3L12 3z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7" />
        <path d="M10 19a2 2 0 004 0" />
      </>
    ),
    bolt: (
      <path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z" />
    ),
    truck: (
      <>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7v-6z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </>
    ),
    package: (
      <>
        <path d="M3 8l9-5 9 5-9 5-9-5z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </>
    ),
    check: <path d="M5 12l5 5L20 7" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    refresh: (
      <>
        <path d="M21 12a9 9 0 11-2.6-6.3" />
        <path d="M21 4v6h-6" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6A3 3 0 0013.4 13.4" />
        <path d="M9.9 5.1A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a17.4 17.4 0 01-3.2 4.1M6.1 6.1C3.9 7.7 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8" />
      </>
    ),
    warning: (
      <>
        <path d="M12 3l9 16H3L12 3z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
    shield: (
      <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6l8-3z" />
    ),
    pen: (
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    ),
    phone: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </>
    ),
    dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
    circle: <circle cx="12" cy="12" r="4" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </>
    ),
    chart: (
      <path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: (
      <path d="M21 14.5A8.5 8.5 0 119.5 3a7 7 0 0011.5 11.5z" />
    ),
  };

  return (
    <svg {...props}>
      {title ? <title>{title}</title> : null}
      {paths[name] || paths.alert}
    </svg>
  );
}

/** Inline SVG string for Leaflet divIcon HTML */
export function truckIconSvg(color = '#fff') {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7v-6z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`;
}
