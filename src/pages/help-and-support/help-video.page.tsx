import React, { useState } from 'react';
import HelpAndSupportComponent from '../../modules/help-and-support/help-and-support';
import { HelpSearchHeader } from '../../modules/help-and-support/help-search';
import HelpVideo from '../../modules/help-and-support/help-video';

const HelpVideoPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <HelpAndSupportComponent
      headerRight={
        <HelpSearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search for videos"
        />
      }
    >
      <HelpVideo
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showAll
      />
    </HelpAndSupportComponent>
  );
};

export default HelpVideoPage;
