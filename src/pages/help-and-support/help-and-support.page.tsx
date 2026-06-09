import React, { useState } from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import HelpAndSupportComponent from '../../modules/help-and-support/help-and-support';
import HelpFaq from '../../modules/help-and-support/help-faq';
import { HelpSearchHeader } from '../../modules/help-and-support/help-search';
import HelpVideo from '../../modules/help-and-support/help-video';
import ROUTES from '../../routes/paths';

const HelpAndSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Help & Support' },
  ]);

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
