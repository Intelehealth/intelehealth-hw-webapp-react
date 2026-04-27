import { Link, useNavigate } from 'react-router-dom';
import './about-us.styles.css';
import { ABOUT_US_CONTENT } from '../../assets/data/about-us.data';
import iconAboutUs from '../../assets/icons/icon-about-us.svg';
import iconInfo from '../../assets/icons/icon-ache-info-dashboard.svg';
import iconGlobe from '../../assets/icons/icon-globe.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import aboutUsMainImage from '../../assets/images/about-us-main-img.png';
import aboutUsMobileImage from '../../assets/images/about-us-main-mobile-img.png';

const AboutusComponent = () => {
  const navigate = useNavigate();

  return (
    <div className="about-us-container w-full bg-white md:rounded-xl md:pt-2 md:px-5 md:pb-5">
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button className="p-1" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left text-gray-600 text-lg" />
          </button>
          <h2 className="text-base font-bold text-gray-900">
            {ABOUT_US_CONTENT.title}
          </h2>
        </div>
        <button className="p-1">
          <img src={iconSync} alt="sync" className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <img src={iconAboutUs} alt="about-us" />
        <span className="text-base font-semibold tracking-wide">
          {ABOUT_US_CONTENT.title}
        </span>
      </div>

      <hr className="about-us-header-hr hidden md:block border-t border-gray-200 mt-2 mb-2" />
      <div className="about-us-content p-3 md:p-0">
        <img
          className="w-full aspect-video object-cover rounded-xl mt-2 mb-4 md:hidden"
          src={aboutUsMobileImage}
          alt="about-us"
        />
        <img
          className="about-us-main-image w-full rounded-xl mt-2 mb-4 hidden md:block"
          src={aboutUsMainImage}
          alt="about-us"
        />
        {ABOUT_US_CONTENT.paragraphs.map((text, idx) => (
          <p
            key={idx}
            className="about-us-paragraph font-normal text-sm mt-1 mb-2 text-gray-700"
          >
            {text}
          </p>
        ))}
        <hr className="about-us-content-hr border-t border-gray-200 mt-1 mb-2" />
        <div className="about-us-info-line flex flex-wrap items-center gap-1.5 mt-1 mb-2 text-sm text-gray-500">
          <img src={iconInfo} alt="" className="w-4 h-4" />
          <span>{ABOUT_US_CONTENT.checkOutLabel}</span>
          <Link
            to={ABOUT_US_CONTENT.termsLink.path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2E1E91] font-medium hover:underline"
          >
            {ABOUT_US_CONTENT.termsLink.text}
          </Link>
        </div>

        <a
          href={ABOUT_US_CONTENT.visitWebsite.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center bg-[#2E1E91] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#241776] transition-colors md:hidden"
        >
          <img src={iconGlobe} alt="" className="w-5 h-5 absolute left-4" />
          {ABOUT_US_CONTENT.visitWebsite.text}
        </a>

        <a
          href={ABOUT_US_CONTENT.visitWebsite.url}
          target="_blank"
          rel="noopener noreferrer"
          className="about-us-btn hidden md:inline-flex items-center gap-1.5 bg-[#2E1E91] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#241776] transition-colors"
        >
          <img src={iconGlobe} alt="" className="w-5 h-5" />
          {ABOUT_US_CONTENT.visitWebsite.text}
        </a>
      </div>
    </div>
  );
};
export default AboutusComponent;
