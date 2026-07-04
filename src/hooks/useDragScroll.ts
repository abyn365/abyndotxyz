import { useEffect, type RefObject } from "react";

export function useDragScroll(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velX = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId = 0;
    let isDragging = false;
    
    // Track cursor position to prevent clicks on drag
    let dragDistance = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only drag with left mouse button
      if (e.button !== 0) return;
      
      isDown = true;
      isDragging = false;
      dragDistance = 0;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velX = 0;
      
      cancelAnimationFrame(momentumId);
      
      el.style.scrollBehavior = "auto";
      el.style.scrollSnapType = "none"; // Temporarily disable snap to avoid drag jitter
      el.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.25; // 1.25x natural sensitivity
      el.scrollLeft = scrollLeft - walk;

      // Velocity low-pass filter
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) {
        const instantVel = (e.pageX - lastX) / dt;
        velX = velX * 0.6 + instantVel * 0.4;
      }
      
      lastX = e.pageX;
      lastTime = now;

      dragDistance = Math.abs(x - startX);
      if (dragDistance > 6) {
        isDragging = true;
      }
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "grab";
      
      // Apply momentum decay
      if (isDragging && Math.abs(velX) > 0.08) {
        let speed = velX * 20; // 20x momentum speed
        const decay = () => {
          el.scrollLeft -= speed;
          speed *= 0.972; // friction factor matching native scrolling inertia
          if (Math.abs(speed) > 0.08) {
            momentumId = requestAnimationFrame(decay);
          } else {
            el.style.scrollBehavior = "smooth";
            el.style.scrollSnapType = ""; // Restore original CSS snap clipping
          }
        };
        el.style.scrollBehavior = "auto";
        momentumId = requestAnimationFrame(decay);
      } else {
        el.style.scrollBehavior = "smooth";
        el.style.scrollSnapType = ""; // Restore original CSS snap clipping
      }
    };

    const handleMouseLeave = () => {
      if (isDown) {
        handleMouseUp();
      }
    };

    // Intercept clicks on child items if dragging exceeds threshold
    const handlePreventClick = (e: MouseEvent) => {
      if (isDragging || dragDistance > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.style.cursor = "grab";
    el.style.userSelect = "none";
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("click", handlePreventClick, true);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("click", handlePreventClick, true);
      cancelAnimationFrame(momentumId);
    };
  }, [ref]);
}
