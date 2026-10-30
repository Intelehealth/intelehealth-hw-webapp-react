import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockUseActivityHeartbeat = vi.fn();

vi.mock('../../../../modules/daily-time-tracking/hooks/useActivityHeartbeat', () => ({
  useActivityHeartbeat: () => mockUseActivityHeartbeat(),
}));

import ActivityHeartbeat from '../../../../modules/daily-time-tracking/components/activity-heartbeat.component';

describe('ActivityHeartbeat', () => {
  it('starts the heartbeat and renders nothing', () => {
    const { container } = render(<ActivityHeartbeat />);

    expect(mockUseActivityHeartbeat).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });
});
