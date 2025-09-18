import type { FC } from 'react';

// Define the types for the component's props
interface DashboardComponentProps {
  message?: string;
}

// Declare the functional component with the FC type and prop interface
const DashboardComponent: FC<DashboardComponentProps> = ({ message }) => {
  return (
    <div>
      <h1>Dashboard</h1>
      {message && <p>{message}</p>}
    </div>
  );
};

export default DashboardComponent;
