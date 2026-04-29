import React, { useMemo, useState } from 'react';
import iconSearch from '../../assets/icons/icon-search.svg';
import iconEducationalVideos from '../../assets/icons/icon-educational-videos.svg';
import { videoList } from '../../assets/data/help.data';
import VideoCard from '../../components/common/video-card.component';
import VideoPopup from '../../components/common/video-popup.component';
import { Input } from '../../components/common';
import { cn } from '../../utils/cn';

type VideoTab = 'health' | 'training' | 'about';

const TABS: { id: VideoTab; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'training', label: 'Training' },
  { id: 'about', label: 'About App' },
];

interface PlayingVideo {
  title: string;
  url: string;
}

const EducationalVideos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VideoTab>('health');
  const [searchQuery, setSearchQuery] = useState('');
  const [playing, setPlaying] = useState<PlayingVideo | null>(null);

  const filtered = useMemo(
    () =>
      videoList.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const MORE_VIDEO_TITLES = ['Treat mild fever at home', 'Treat cough at home'];
  const moreVideos = filtered.filter(v => MORE_VIDEO_TITLES.includes(v.title));
  const mostSearched = filtered.filter(
    v => !MORE_VIDEO_TITLES.includes(v.title)
  );

  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-5">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={iconEducationalVideos}
          alt=""
          className="w-9 h-9 flex-shrink-0"
        />
        <h1 className="text-sm md:text-base font-semibold text-(--color-dark)">
          Educational Videos
        </h1>
      </div>

      <hr className="border-t border-gray-200 mb-4" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <nav className="flex gap-6 border-b border-gray-200 md:border-b-0">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-2 text-sm transition relative cursor-pointer',
                  isActive
                    ? 'text-(--color-dark) font-semibold'
                    : 'text-(--color-muted) hover:text-(--color-dark)'
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-(--color-primary)" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="md:w-[280px]">
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for videos"
            variant="default"
            size="default"
            leftIcon={<img src={iconSearch} alt="" className="w-4 h-4" />}
          />
        </div>
      </div>

      {activeTab === 'health' && (
        <>
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-(--color-dark) mb-3">
              Most Searched
            </h2>
            <div className="flex flex-col md:grid md:grid-cols-4 md:gap-4">
              {mostSearched.map((v, i) => (
                <VideoCard
                  key={`m-${i}`}
                  title={v.title}
                  duration={v.duration}
                  thumbnail={v.thumbnail}
                  videoUrl={v.videoUrl}
                  onClick={() =>
                    setPlaying({ title: v.title, url: v.videoUrl })
                  }
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-(--color-dark) mb-3">
              More Videos
            </h2>
            <div className="flex flex-col md:grid md:grid-cols-4 md:gap-4">
              {moreVideos.map((v, i) => (
                <VideoCard
                  key={`r-${i}`}
                  title={v.title}
                  duration={v.duration}
                  thumbnail={v.thumbnail}
                  videoUrl={v.videoUrl}
                  onClick={() =>
                    setPlaying({ title: v.title, url: v.videoUrl })
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'training' && (
        <p className="text-sm text-(--color-muted)">No training videos yet.</p>
      )}
      {activeTab === 'about' && (
        <p className="text-sm text-(--color-muted)">No About-App videos yet.</p>
      )}

      <VideoPopup
        open={!!playing}
        title={playing?.title ?? ''}
        url={playing?.url ?? ''}
        onClose={() => setPlaying(null)}
      />
    </div>
  );
};

export default EducationalVideos;
