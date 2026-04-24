import React from 'react';

const HelpCategoryContext = React.createContext<string>('All');
export const useHelpCategory = () => React.useContext(HelpCategoryContext);
export default HelpCategoryContext;
