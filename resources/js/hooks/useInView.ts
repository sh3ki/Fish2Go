import { useState, useRef, useEffect } from "react";

export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    let observer;
    if (ref.current) {
      observer = new IntersectionObserver(([entry]) => {
        setInView(entry.isIntersecting);
      }, options);
      observer.observe(ref.current);
    }
    return () => {
      if (observer && ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return { ref, inView };
}
