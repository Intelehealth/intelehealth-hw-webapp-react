import React, { useState } from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import HelpAndSupportComponent from '../../modules/help-and-support/help-and-support';
import { HelpSearchHeader } from '../../modules/help-and-support/help-search';
import HelpVideo from '../../modules/help-and-support/help-video';
import ROUTES from '../../routes/paths';

const HelpVideoPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Help & Support', path: ROUTES.HELP },
    { label: 'Videos' },
  ]);

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
