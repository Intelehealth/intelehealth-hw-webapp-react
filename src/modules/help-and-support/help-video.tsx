import React from 'react';
import { useNavigate } from 'react-router-dom';
import { videoList, type HelpVideoProps } from '../../assets/data/help.data';
import { HelpSearchMobile } from './help-search';
import VideoCard from '../../components/common/video-card.component';
import { useHelpCategory } from './context/help-category.context';

const HelpVideo: React.FC<HelpVideoProps> = ({
  searchQuery: externalQuery,
  onSearchChange,
  showAll = false,
}) => {
  const activeCategory = useHelpCategory();
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = React.useState('');
  const searchQuery = externalQuery ?? internalQuery;
  const setSearchQuery = onSearchChange ?? setInternalQuery;

  const filteredVideos = videoList.filter(video => {
    const matchesCategory =
      activeCategory === 'All' || video.category === activeCategory;
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayedVideos = showAll ? filteredVideos : filteredVideos.slice(0, 3);

  return (
    <>
      <HelpSearchMobile
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search for videos"
      />
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">Most searched</p>
        {!showAll && (
          <button
            onClick={() => navigate('/help/videos')}
            className="shrink-0 rounded-md px-3 py-1 text-xs font-medium border border-[#2E1E91] bg-white text-[#2E1E91] hover:bg-[#2E1E91] hover:text-white transition-colors"
          >
            More
          </button>
        )}
      </div>
      <div className="flex flex-col md:grid md:grid-cols-4 md:gap-4">
        {displayedVideos.map((video, index) => (
          <VideoCard
            key={index}
            title={video.title}
            duration={video.duration}
            thumbnail={video.thumbnail}
            videoUrl={video.videoUrl}
          />
        ))}
      </div>
    </>
  );
};

export default HelpVideo;
