import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoaderProps {
}

const Loader: React.FC<LoaderProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-32 h-32 relative translate-y-[30px]">
        <DotLottieReact
          src="/assets/yellow taxi.lottie"
          className="w-full h-full filter saturate-[1.45] hue-rotate-[2deg] brightness-[1.14] contrast-[1.08] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
          loop
          autoplay
        />
      </div>
    </div>
  );
};

export default Loader;