import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ToggleSwitch from './ToggleSwitch';

describe('ToggleSwitch', () => {
  it('reflects its pressed state and forwards clicks', () => {
    const onClick = vi.fn();

    render(<ToggleSwitch checked onClick={onClick} />);

    const toggle = screen.getByRole('button');

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();

    render(<ToggleSwitch disabled onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
