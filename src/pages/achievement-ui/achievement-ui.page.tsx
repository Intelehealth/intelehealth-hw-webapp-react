import React from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { AchievementUiComponent } from '../../modules/achievement-ui/achievement-ui.component';
import ROUTES from '../../routes/paths';

const AchievementUiPage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Achievements' },
  ]);

  return <AchievementUiComponent />;
};
export default AchievementUiPage;
