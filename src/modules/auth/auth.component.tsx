import React from 'react';
import mainLogo from '../../assets/logo/intelehealth-logo-white.png';
import logoBg from '../../assets/logo/logo-bg.svg';
import type { Slide } from '../../types/common.types';
import ImageSlider from './common/image-slider.component';

interface AuthComponentProps {
  children?: React.ReactNode;
  title: string;
  description: string;
  mobileImage?: string;
  slides: Slide[];
}

const AuthComponent: React.FC<AuthComponentProps> = ({
  children,
  title = '',
  description = '',
  mobileImage,
  slides,
}) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT HERO (desktop only) */}
      <aside className="hidden lg:flex flex-1 flex-col login-left-hero justify-between px-12 py-10 bg-[var(--color-primary)]">
        <div>
          <img
            src={logoBg}
            alt="bg"
            className="absolute top-[50px] left-[50px]"
          />
          <img
            src={mainLogo}
            alt="hero"
            className="h-[74px] ml-4 mt-4 object-contain"
          />
        </div>

        <div className="relative max-w-md text-center z-10">
          <ImageSlider slides={slides} />
        </div>

        <p className="text-xs text-white/70 w-full text-center z-10">
          Copyright © 2025 Intelehealth, a 501 (c) (3) & Section 8 non-profit
          organisation
        </p>
      </aside>

      <div className="hiddne lg:flex w-[8%] bg-(--color-primary) clip-left clip-left-reverse scale-[1.01] transform origin-right"></div>
      {/* RIGHT: login form (desktop + mobile) */}
      <main className="flex-1 flex flex-col lg:flex-row items-end lg:items-center justify-between lg:justify-center bg-(--color-primary) lg:bg-(--color-bg)">
        <div className="lg:hidden flex flex-col justify-center w-full mt-20">
          <h3 className="text-2xl font-semibold text-white w-full text-center">
            {title}
          </h3>
          <p className="text-base text-white w-full text-center mt-4 ">
            {description}
          </p>
          {mobileImage && (
            <img
              src={mobileImage}
              alt="hero"
              className="h-[74px] mt-10 object-contain"
            />
          )}
        </div>
        {children}
      </main>
    </div>
  );
};

export default AuthComponent;
