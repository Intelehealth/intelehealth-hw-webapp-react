import React from 'react';
import mainLogo from '../../assets/logo/intelehealth-logo-white.png';
import logoBg from '../../assets/logo/logo-bg.svg';
import { Dropdown } from '../../components/common';
import { Loader } from '../../components/loader';
import { env } from '../../config/env';
import type { Slide } from '../../types/common.types';
import ImageSlider from './common/image-slider.component';

interface AuthComponentProps {
  children?: React.ReactNode;
  title: string;
  description: string;
  mobileImage?: string;
  slides: Slide[];
  showLanguages?: boolean;
  hideSliderImagesForMobile?: boolean;
}

const AuthComponent: React.FC<AuthComponentProps> = ({
  children,
  title = '',
  description = '',
  mobileImage,
  slides,
  showLanguages = true,
  hideSliderImagesForMobile = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Loader />
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
          <small className="text-xs text-white/70 w-full text-center z-10">
            <br />
            (Version: {env.APP_VERSION})
          </small>
        </p>
        <p className="text-xs text-white/70 w-full text-center z-10"></p>
      </aside>

      <div className="hiddne lg:flex w-[8%] bg-(--color-primary) clip-left clip-left-reverse transform origin-right border-[1px] border-solid border-(--color-primary) scale-[1.00001]"></div>

      {/* RIGHT: login form (desktop + mobile) */}
      <main className="flex-1 flex flex-col items-end md:items-center lg:items-center justify-between lg:justify-start bg-(--color-primary) lg:bg-(--color-bg) ">
        <div
          className="hidden md:flex justify-end pt-10 px-8 w-full"
          style={{ visibility: showLanguages ? 'visible' : 'hidden' }}
        >
          <Dropdown
            options={[
              { label: 'English', value: 'english' },
              { label: 'हिंदी', value: 'hindi' },
              { label: 'मराठी', value: 'marathi' },
              { label: 'മലയാളം', value: 'bangoli' },
              { label: 'ગુજરાતી', value: 'gujarati' },
            ]}
            value="english"
            className="w-[30%] min-w-[50px] max-w-[150px]"
          />
        </div>
        <div className="md:hidden lg:hidden flex flex-col justify-center w-full mt-20">
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
        <div className="hidden md:flex lg:hidden flex-col justify-center w-full mt-10">
          <div>
            <img
              src={logoBg}
              alt="bg"
              className="absolute top-[50px] left-[50px] h-[80px]"
            />
            <img
              src={mainLogo}
              alt="hero"
              className="absolute top-[55px] left-[60px] h-[65px]"
            />
          </div>
          <div className="relative max-w-md text-center z-10">
            <ImageSlider
              slides={slides}
              hideImages={hideSliderImagesForMobile}
            />
          </div>
          <p className="text-xs text-white/70 w-full text-center z-10 mt-8">
            Copyright © 2025 Intelehealth, a 501 (c) (3) & Section 8 non-profit
            organisation
          </p>
        </div>
        <div className="h-full flex flex-col justify-center w-full lg:w-auto md:w-[70%]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthComponent;
