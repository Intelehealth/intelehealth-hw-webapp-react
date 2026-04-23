import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import iconHelpAndSupport from '../../assets/icons/icon-help-and-support.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import { helpCategories } from '../../assets/data/help.data';
import HelpCategoryContext from './context/help-category.context';

const getTitle = (pathname: string) => {
  if (pathname.includes('/help/videos')) return 'Videos';
  if (pathname.includes('/help/faq')) return 'FAQs';
  return 'Help & Support';
};

const HelpAndSupportComponent: React.FC<{
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
}> = ({ children, headerRight }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = getTitle(pathname);
  const isSubPage = pathname !== '/help';
  const [activeCategory, setActiveCategory] = React.useState('All');

  return (
    <HelpCategoryContext.Provider value={activeCategory}>
      <div className="w-full bg-white md:rounded-xl md:pt-3 md:px-5 md:pb-5">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isSubPage && (
              <button className="p-1" onClick={() => navigate('/help')}>
                <i className="fa-solid fa-arrow-left text-gray-600 text-lg" />
              </button>
            )}
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
          </div>
          <button className="p-1">
            <img src={iconSync} alt="sync" className="w-5 h-5" />
          </button>
        </div>
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubPage ? (
              <button className="p-1" onClick={() => navigate('/help')}>
                <i className="fa-solid fa-arrow-left text-gray-600 text-lg" />
              </button>
            ) : (
              <img src={iconHelpAndSupport} alt="help" />
            )}
            <span className="text-base font-semibold tracking-wide">
              {title}
            </span>
          </div>
          {headerRight}
        </div>

        <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />

        <div className="p-3 md:p-0">
          <div className="flex flex-row flex-wrap items-center gap-2 mt-2 pb-3 border-b border-gray-200 mb-4 md:border-b-0 md:mt-3 md:mb-4 md:pb-0">
            {helpCategories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-medium border transition-colors ${
                  activeCategory === category
                    ? 'bg-[#2E1E91] text-white border-[#2E1E91]'
                    : 'bg-[#EFE8FF] text-[#2E1E91] border-[#EFE8FF]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {children}
        </div>
      </div>
    </HelpCategoryContext.Provider>
  );
};

export default HelpAndSupportComponent;
