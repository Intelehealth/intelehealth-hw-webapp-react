import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  questionAnswerList,
  type HelpFaqProps,
} from '../../assets/data/help.data';
import iconChevronDown from '../../assets/icons/icon-chevron-down.svg';
import { HelpSearchMobile } from './help-search';
import { useHelpCategory } from './context/help-category.context';

const QuestionAnswerCard = ({
  Question,
  Answer,
}: {
  Question: string;
  Answer: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const funToggleQuestion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div
        className="flex items-center justify-between py-4 cursor-pointer"
        onClick={funToggleQuestion}
      >
        <span className="text-sm font-normal text-gray-900">{Question}</span>
        <img
          src={iconChevronDown}
          alt="toggle"
          className={`shrink-0 ml-4 w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="pb-4">
          <p className="text-sm text-gray-500">{Answer}</p>
        </div>
      )}
      <div className="w-full md:w-[312px] border-b border-gray-200" />
    </div>
  );
};

const HelpFaq: React.FC<HelpFaqProps> = ({
  searchQuery: externalQuery,
  onSearchChange,
}) => {
  const activeCategory = useHelpCategory();
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = React.useState('');
  const searchQuery = externalQuery ?? internalQuery;
  const setSearchQuery = onSearchChange ?? setInternalQuery;

  const filteredFaqs = questionAnswerList.filter(item => {
    const matchesCategory =
      activeCategory === 'All' || item.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mt-4 md:mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">
          Frequently asked questions
        </p>
        <button
          onClick={() => navigate('/help/faq')}
          className="shrink-0 rounded-md px-3 py-1 text-xs font-medium border border-[#2E1E91] bg-white text-[#2E1E91] hover:bg-[#2E1E91] hover:text-white transition-colors"
        >
          More
        </button>
      </div>

      <HelpSearchMobile
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search FAQ"
      />
      {filteredFaqs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No FAQs found</p>
      ) : (
        filteredFaqs.map((item, index) => (
          <QuestionAnswerCard
            key={index}
            Question={item.question}
            Answer={item.answer}
          />
        ))
      )}
    </div>
  );
};

export default HelpFaq;
