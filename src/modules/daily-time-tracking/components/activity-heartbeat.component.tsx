import { useActivityHeartbeat } from '../hooks/useActivityHeartbeat';

/**
 * Renders nothing. Sends the time-spent heartbeat while the signed-in
 * layout is on screen, so time counts on every page, not only the dashboard.
 */
const ActivityHeartbeat = () => {
  useActivityHeartbeat();
  return null;
};

export default ActivityHeartbeat;
