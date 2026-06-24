"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

// Replaces framer-motion fade-up on the Vite pages: an IntersectionObserver toggles
// `data-shown` once the element scrolls into view. CSS (.mk-reveal in marketing.css)
// does the transition. No animation library.
export function AnimatedSection({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag ref={ref} data-shown={shown} className={`mk-reveal ${className}`}>
      {children}
    </Tag>
  );
}
