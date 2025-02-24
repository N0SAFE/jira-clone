import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import errorAnimation from '../assets/error-animation.json';

export const ErrorAnimation = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      const anim = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: errorAnimation,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice',
          progressiveLoad: false,
          hideOnTransparent: false
        }
      });

      return () => anim.destroy();
    }
  }, []);

  return (
    <div 
      ref={container} 
      className="w-64 h-64 mx-auto" 
      style={{ maxWidth: '100%', background: 'transparent' }}
    />
  );
};