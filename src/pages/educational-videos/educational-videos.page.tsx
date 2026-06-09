import React from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import EducationalVideos from '../../modules/educational-videos/educational-videos.component';
import ROUTES from '../../routes/paths';

const EducationalVideosPage: React.FC = () => {
  useBreadcrumb(
    [
      { label: 'Dashboard', path: ROUTES.DASHBOARD },
      { label: 'Educational Videos' },
    ],
    { bgColor: 'bg-gray-50' }
  );

  return (
    <div
      className="w-full h-full bg-gray-50 px-3 sm:px-5 py-3 sm:py-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
    >
      <EducationalVideos />
    </div>
  );
};

export default EducationalVideosPage;
