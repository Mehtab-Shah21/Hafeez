/**
 * The ONE requestAnimationFrame loop for scroll-linked work (navbar, parallax, scroll-scrubbed
 * video, Lenis). Subscribers get the frame time; the loop stops itself when nobody is listening.
 * Scroll position is read once per frame (batched read) and shared, so subscribers never force
 * layout by reading scrollY themselves.
 */
type Tick = (time: number, scrollY: number) => void;

const subscribers = new Set<Tick>();
let frame = 0;

function loop(time: number) {
  const y = window.scrollY;
  for (const fn of subscribers) fn(time, y);
  frame = subscribers.size ? requestAnimationFrame(loop) : 0;
}

export function subscribeFrame(fn: Tick): () => void {
  subscribers.add(fn);
  if (!frame && typeof window !== 'undefined') frame = requestAnimationFrame(loop);
  return () => {
    subscribers.delete(fn);
    if (!subscribers.size && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}
