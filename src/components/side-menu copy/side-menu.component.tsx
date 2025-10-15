import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mainLogo from '../../assets/logo/intelehealth-logo-white.png';

const SideMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside (only if open)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hamburgerBtnRef.current &&
        hamburgerBtnRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(!isMenuOpen);
      } else if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        setIsMenuOpen(false);
      }
    };

    if (window.innerWidth < 768)
      document.addEventListener('click', handleClickOutside);

    return () => {
      if (window.innerWidth < 768)
        document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div>
      {/* Hamburger Menu for Mobile */}
      <button
        className="md:hidden absolute flex items-center p-4"
        ref={hamburgerBtnRef}
      >
        <i className="fas fa-bars text-2xl"></i>
      </button>

      {/* Side Menu for Desktop and Mobile */}
      <div
        className={`${
          isMenuOpen
            ? 'absolute opacity-100 translate-y-0'
            : 'hidden opacity-0 -translate-y-4'
        } md:block md:w-70 w-56 bg-(--color-primary) text-white p-4 h-full border-2 border-white rounded-lg shadow-lg z-50 flex flex-col`}
        ref={menuRef}
      >
        <div className="mb-6">
          <img src={mainLogo} alt="hero" className="h-[74px] bject-contain" />
        </div>
        <nav className="flex flex-col space-y-4">
          <Link
            to="/"
            className="flex items-center space-x-2 hover:bg-(--color-primary-dark) p-2 rounded-lg min-h-[50px]"
          >
            <i className="fas fa-home"></i>
            <span className="text-base">Home</span>
          </Link>
        </nav>
        <nav className="flex flex-col space-y-4 mt-auto">
          <Link
            to="/"
            className="flex items-center space-x-2 hover:bg-purple-600 p-2 rounded-lg"
          >
            <i className="fas fa-power-off"></i>
            <span>Logout</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default SideMenu;
