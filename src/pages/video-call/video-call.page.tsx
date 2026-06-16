import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ROUTES from '../../routes/paths';

const VideoCallPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(ROUTES.DASHBOARD, { replace: true });
  }, [navigate]);
  return null;
};

export default VideoCallPage;
