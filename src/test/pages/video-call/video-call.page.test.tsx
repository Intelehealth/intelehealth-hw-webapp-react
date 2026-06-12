import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import VideoCallPage from '../../../pages/video-call/video-call.page';
import ROUTES from '../../../routes/paths';

describe('VideoCallPage', () => {
  it('redirects to the dashboard', () => {
    render(<VideoCallPage />);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.DASHBOARD, {
      replace: true,
    });
  });
});
