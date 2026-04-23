import React from 'react';
import iconBackArrow from '../../assets/icons/icon-back-arrow.svg';
import iconSearch from '../../assets/icons/icon-search.svg';
import iconSync from '../../assets/icons/icon-sync.svg';

const QuestionAnswerCard = ({ Question, Answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const funToggleQuestion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border-b border-gray-200">
      <div
        className="flex items-center justify-between py-4 cursor-pointer"
        onClick={funToggleQuestion}
      >
        <span className="text-sm font-normal text-gray-900">{Question}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 ml-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="#9CA3AF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="pb-4">
          <p className="text-sm text-gray-500">{Answer}</p>
        </div>
      )}
    </div>
  );
};

const videoCategories = [
  'All',
  'Check-up',
  'Appointment',
  'Registration',
  'Visit',
];

const videoList = [
  {
    title: 'How to book an appointment with doctor',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Appointment',
  },
  {
    title: 'How to book an appointment with doctor',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Appointment',
  },
  {
    title: 'How to book an appointment with doctor',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Appointment',
  },
  {
    title: 'How to register new a patient?',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Registration',
  },
  {
    title: 'How to book an appointment with doctor',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Appointment',
  },
  {
    title: 'How to book an appointment with doctor',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Appointment',
  },
  {
    title: 'How to register new a patient?',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Registration',
  },
  {
    title: 'How to register new a patient?',
    duration: '0:50',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Registration',
  },
];

const VideoCard = ({
  title,
  duration,
  thumbnail,
  videoUrl,
}: {
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}) => {
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {/* Mobile: horizontal row | Desktop: vertical card */}
      <div className="flex flex-row items-center gap-3 py-4 border-b border-gray-100 md:flex-col md:items-start md:py-0 md:border-b-0 md:gap-2">
        <div className="relative group rounded-lg overflow-hidden shrink-0 w-[120px] h-[78px] md:w-full md:h-auto md:aspect-video">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#2E1E91]/80 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center group-hover:scale-110 transition">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 2L14 8L4 14V2Z" fill="#ffffff" />
              </svg>
            </div>
          </div>
          {/* Duration Badge */}
          <div
            className="absolute bottom-1.5 right-1.5 bg-black/70 text-white px-1.5 py-0.5 rounded"
            style={{ fontSize: '10px' }}
          >
            {duration}
          </div>
        </div>
        <span className="text-sm text-gray-800 leading-snug">{title}</span>
      </div>
    </a>
  );
};

const questionAnswerList = [
  {
    question: 'How intelehealth works?',
    answer:
      "Intelehealth has developed a comprehensive technology platform that Governments, NGO's and Hospitals can use to deliver telemedicine-based care to their beneficiaries. Built with powerful features like a digital assistant with 80+ care protocols makes it easy for any organization to use and adapt it to meet their needs!",
  },
  {
    question: 'Why Intelehealth exists?',
    answer:
      'Team at Intelehealth has a vision of "Health for all". Thus, Intelehealth exists to keep this vision of universal health coverage alive. It strive to achieve that every single citizen in this world should be able to receive the health services they need, when and where they need them, without facing any financial hardship.',
  },
  {
    question: 'How intelehealth help patients?',
    answer:
      "Our Telemedicine app makes specialist doctor consultations available to the rural populations coming to primary healthcare. Using app, the HWs are able to capture details of patient's medication history, diagnostics, prescriptions and treatment. All these details our then shared with the remote doctors to provide consultation. It helps in saving patients from traveling miles for healthcare.",
  },
  {
    question: 'How to register new patient?',
    answer:
      'To register a patient, click on the "Add Patient" tab on the home screen. Read out the privacy policy to the patient. If they accept, fill out all the details to successfully register a patient.',
  },
  {
    question: 'How to add a new visit?',
    answer:
      'Once the patient is registered, on patient details screen, click "Start Visit" button to create a new visit for the patient.',
  },
  {
    question: 'How to book an appointment?',
    answer:
      'Once the patient is registered and the visit is created, on visit summary screen, click "Appointment" button. Select the date and time (from available slots) which is suitable to the patient. Click on "Book Appointment"',
  },
];

const HelpAndSupportComponent: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredVideos = videoList.filter(video => {
    const matchesCategory =
      activeCategory === 'All' || video.category === activeCategory;
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative w-full bg-white rounded-xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3 md:pb-3 md:border-b md:border-gray-200">
        <div className="flex items-center gap-2">
          <img
            src={iconBackArrow}
            alt="back"
            className="w-5 h-5 cursor-pointer"
          />
          <span className="text-base font-semibold text-gray-900">Videos</span>
        </div>
        {/* Mobile: sync icon | Desktop: search */}
        <img
          src={iconSync}
          alt="sync"
          className="w-5 h-5 cursor-pointer md:hidden"
        />
        <div className="hidden md:block relative">
          <img
            src={iconSearch}
            alt="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
          />
          <input
            type="text"
            placeholder="Search for videos"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#2E1E91] w-56 bg-gray-50"
          />
        </div>
      </div>

      {/* Mobile: full-width search bar */}
      <div className="relative mt-1 mb-3 md:hidden">
        <img
          src={iconSearch}
          alt="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
        />
        <input
          type="text"
          placeholder="Search for videos"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#2E1E91] box-border"
        />
      </div>

      {/* Category Buttons */}
      <div className="flex flex-row flex-wrap gap-2 mt-2 pb-3 border-b-2 border-[#2E1E91]/20 mb-4 md:border-b-0 md:mt-3 md:mb-4 md:pb-0">
        {videoCategories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-medium border transition-colors ${
              activeCategory === category
                ? 'bg-[#2E1E91] text-white border-[#2E1E91]'
                : 'bg-white text-[#2E1E91] border-[#2E1E91]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Video List */}
      <div className="flex flex-col md:grid md:grid-cols-4 md:gap-4">
        {filteredVideos.map((video, index) => (
          <VideoCard
            key={index}
            title={video.title}
            duration={video.duration}
            thumbnail={video.thumbnail}
            videoUrl={video.videoUrl}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-4 md:mt-6">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Frequently asked questions
        </p>
        {questionAnswerList.map((item, index) => (
          <QuestionAnswerCard
            key={index}
            Question={item.question}
            Answer={item.answer}
          />
        ))}
      </div>

      {/* Chatbot Floating Icon */}
      <button className="sticky bottom-6 float-right mr-2 w-12 h-12 bg-[#4BBEA0] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition z-50">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 11.5C21 16.75 16.75 21 11.5 21C9.8 21 8.2 20.55 6.8 19.75L2 21L3.25 16.2C2.45 14.8 2 13.2 2 11.5C2 6.25 6.25 2 11.5 2C16.75 2 21 6.25 21 11.5Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default HelpAndSupportComponent;
