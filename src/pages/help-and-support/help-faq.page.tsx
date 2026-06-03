import React, { useState } from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import HelpAndSupportComponent from '../../modules/help-and-support/help-and-support';
import HelpFaq from '../../modules/help-and-support/help-faq';
import { HelpSearchHeader } from '../../modules/help-and-support/help-search';
import ROUTES from '../../routes/paths';

const HelpFaqPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Help & Support', path: ROUTES.HELP },
    { label: 'FAQ' },
  ]);

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
