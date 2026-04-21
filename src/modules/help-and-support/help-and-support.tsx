import React from 'react';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';

const QuestionAnswerCard = ({ Question, Answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const funToggleQuestion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#2E1E91]">{Question}</span>
        <span
          className="text-sm font-medium text-[#2E1E91]"
          onClick={funToggleQuestion}
        >
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div>
          <p className="text-sm text-gray-600">{Answer}</p>
        </div>
      )}

      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />
    </div>
  );
};

const VideoShowCardData = () => {
  const thumbnail = `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`;
  const videoUrl = `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`;
  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-3xl aspect-video text-center ">
        {/* <iframe
          className="w-full h-full rounded-2xl shadow-lg"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="YouTube video"
          frameBorder="0"
          allowFullScreen
        ></iframe> */}
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
          <div className="relative cursor-pointer group">
            <img
              src={thumbnail}
              alt="YouTube Thumbnail"
              className="rounded-xl shadow-lg"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-600 text-white rounded-full p-4 group-hover:scale-110 transition">
                ▶
              </div>
            </div>
          </div>
        </a>
        <span>YouTube video </span>
      </div>
    </div>
  );
};
const HelpAndSupportComponent: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-5">
      {/* Header */}
      <div className="hidden md:flex items-center gap-3 mb-2">
        <img src={iconsvioletFieldAppointmentDetails} alt="icon" />
        <span className="text-sm font-medium text-[#2E1E91]">Video</span>
      </div>
      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />

      <div className="flex flex-row gap-4 md:gap-6">
        <button className=" rounded-lg btn-base-styles btn-primary-variant px-3 py-1 gap-2">
          <span className="mx-auto w-full font-normal text-base">All</span>
        </button>
        <button className="rounded-lg btn-base-styles btn-primary-variant px-3 py-1 gap-2">
          <span className="mx-auto w-full font-normal text-base">Check Up</span>
        </button>
        <button className="rounded-lg btn-base-styles btn-primary-variant px-3 py-1 gap-2">
          <span className="mx-auto w-full font-normal text-base">
            Appointment
          </span>
        </button>
        <button className="rounded-lg btn-base-styles btn-primary-variant px-3 py-1 gap-2">
          <span className="mx-auto w-full font-normal  text-base">
            Registration
          </span>
        </button>
        <button className="rounded-lg btn-base-styles btn-primary-variant px-3 py-1 gap-2">
          <span className="mx-auto w-full font-normal text-base">visit</span>
        </button>
      </div>

      <div className="flex flex-row gap-4 w-full mt-4 md:mt-6">
        <VideoShowCardData />
        <VideoShowCardData />
        <VideoShowCardData />
        <VideoShowCardData />
      </div>

      <div className="mt-4 md:mt-6">
        <p>Frequently Asked Questions</p>
        <QuestionAnswerCard
          Question="How to book an appointment?"
          Answer="To book an appointment, click on the 'Book Appointment' button on the dashboard and follow the prompts."
        />
        <QuestionAnswerCard
          Question="What are the available payment options?"
          Answer="We accept credit/debit cards, net banking, and UPI payments for your convenience."
        />
        <QuestionAnswerCard
          Question="How can I access my medical records?"
          Answer="You can access your medical records by logging into your account and navigating to the 'My Records' section."
        />
      </div>
    </div>
  );
};

export default HelpAndSupportComponent;
