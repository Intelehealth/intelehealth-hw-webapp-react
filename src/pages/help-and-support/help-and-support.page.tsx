import React, { useState } from 'react';
import HelpAndSupportComponent from '../../modules/help-and-support/help-and-support';
import HelpFaq from '../../modules/help-and-support/help-faq';
import { HelpSearchHeader } from '../../modules/help-and-support/help-search';
import HelpVideo from '../../modules/help-and-support/help-video';

const HelpAndSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <HelpAndSupportComponent
      headerRight={
        <HelpSearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search for help"
        />
      }
    >
      <HelpVideo searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <HelpFaq searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </HelpAndSupportComponent>
  );
};

export default HelpAndSupportPage;
