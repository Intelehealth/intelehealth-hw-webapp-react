import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import CallPip from '../../../components/call/call-pip.component';

const baseProps = {
  callerName: 'Foo',
  onMaximize: vi.fn(),
  onEndCall: vi.fn(),
};

/* jsdom does not implement PointerEvent; polyfill it from MouseEvent so
 clientX/clientY are carried through fireEvent.pointer* calls. **/
 
class PointerEventPolyfill extends MouseEvent {}

describe('CallPip', () => {
  beforeAll(() => {
    if (!('PointerEvent' in window)) {
      (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent =
        PointerEventPolyfill as unknown as typeof MouseEvent;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
  });

  it('renders caller name and action buttons', () => {
    render(<CallPip {...baseProps} />);
    expect(screen.getByText('Dr. Foo')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximize call')).toBeInTheDocument();
    expect(screen.getByLabelText('End call')).toBeInTheDocument();
  });

  it('starts docked to the bottom-right corner', () => {
    render(<CallPip {...baseProps} />);
    const pip = screen.getByTestId('call-pip');
    expect(pip.style.right).toBe('24px');
    expect(pip.style.bottom).toBe('24px');
  });

  it('invokes onMaximize and onEndCall', () => {
    render(<CallPip {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Maximize call'));
    fireEvent.click(screen.getByLabelText('End call'));
    expect(baseProps.onMaximize).toHaveBeenCalledTimes(1);
    expect(baseProps.onEndCall).toHaveBeenCalledTimes(1);
  });

  it('moves to the dragged position via pointer events', () => {
    render(<CallPip {...baseProps} />);
    const pip = screen.getByTestId('call-pip');
    vi.spyOn(pip, 'getBoundingClientRect').mockReturnValue({
      left: 600,
      top: 500,
      right: 920,
      bottom: 724,
      width: 320,
      height: 224,
      x: 600,
      y: 500,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(pip, { clientX: 610, clientY: 510 });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 200 });

    // offset = (10, 10) -> new pos = (290, 190)
    expect(pip.style.left).toBe('290px');
    expect(pip.style.top).toBe('190px');

    fireEvent.pointerUp(window);
  });

  it('clamps the position within the viewport bounds', () => {
    render(<CallPip {...baseProps} />);
    const pip = screen.getByTestId('call-pip');
    vi.spyOn(pip, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 320,
      bottom: 224,
      width: 320,
      height: 224,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(pip, { clientX: 0, clientY: 0 });
    // Drag far beyond the bottom-right edge.
    fireEvent.pointerMove(window, { clientX: 5000, clientY: 5000 });

    // maxX = 1000 - 320 = 680, maxY = 800 - 224 = 576
    expect(pip.style.left).toBe('680px');
    expect(pip.style.top).toBe('576px');

    // Drag beyond the top-left edge.
    fireEvent.pointerMove(window, { clientX: -5000, clientY: -5000 });
    expect(pip.style.left).toBe('0px');
    expect(pip.style.top).toBe('0px');

    fireEvent.pointerUp(window);
  });

  it('ignores drags that start on a button', () => {
    render(<CallPip {...baseProps} />);
    const pip = screen.getByTestId('call-pip');
    fireEvent.pointerDown(screen.getByLabelText('Maximize call'), {
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 300 });
    // Still docked, no inline left/top applied.
    expect(pip.style.left).toBe('');
    expect(pip.style.top).toBe('');
  });

  it('stops moving after pointer up', () => {
    render(<CallPip {...baseProps} />);
    const pip = screen.getByTestId('call-pip');
    vi.spyOn(pip, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 420,
      bottom: 324,
      width: 320,
      height: 224,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(pip, { clientX: 110, clientY: 110 });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200 });
    expect(pip.style.left).toBe('190px');

    fireEvent.pointerUp(window);
    fireEvent.pointerMove(window, { clientX: 500, clientY: 500 });
    // Position unchanged after release.
    expect(pip.style.left).toBe('190px');
  });
});
