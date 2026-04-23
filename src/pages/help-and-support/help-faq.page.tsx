import React, { useState } from 'react';
import HelpAndSupportComponent from '../../modules/help-and-support/help-and-support';
import HelpFaq from '../../modules/help-and-support/help-faq';
import { HelpSearchHeader } from '../../modules/help-and-support/help-search';

const HelpFaqPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <HelpAndSupportComponent
      headerRight={
        <HelpSearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search FAQs"
        />
      }
    >
      <HelpFaq searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </HelpAndSupportComponent>
  );
};

export default HelpFaqPage;
