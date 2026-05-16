import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HistoricalCaseControls from './HistoricalCaseControls';

const filters = {
  search: '',
  diagnosis: '',
  status: '',
};

describe('HistoricalCaseControls', () => {
  it('resets pagination when search and filters change', () => {
    const onFilterChange = vi.fn();

    render(<HistoricalCaseControls filters={filters} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByPlaceholderText('Search patient name, ID, or diagnosis...'), {
      target: { value: 'sarah' },
    });
    fireEvent.change(screen.getByDisplayValue('All Diagnosis'), {
      target: { value: 'melanoma' },
    });
    fireEvent.change(screen.getByDisplayValue('All Status'), {
      target: { value: 'approved' },
    });

    expect(onFilterChange).toHaveBeenNthCalledWith(1, { search: 'sarah', page: 1 });
    expect(onFilterChange).toHaveBeenNthCalledWith(2, { diagnosis: 'melanoma', page: 1 });
    expect(onFilterChange).toHaveBeenNthCalledWith(3, { status: 'approved', page: 1 });
  });
});
