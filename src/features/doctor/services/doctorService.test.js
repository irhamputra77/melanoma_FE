import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../services/api';
import { getCaseHistory } from './doctorService';

vi.mock('../../../services/api', () => ({
  default: {
    request: vi.fn(),
  },
}));

describe('doctorService.getCaseHistory', () => {
  beforeEach(() => {
    api.request.mockReset();
  });

  it('normalizes filters and response metadata', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [{ caseId: 'case-1' }],
        meta: { page: 2, limit: 5, total: 12 },
      },
    });

    const result = await getCaseHistory({
      page: 2,
      limit: 5,
      search: 'sarah',
      status: 'verified',
    });

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'get',
      url: '/cases/history',
      params: {
        page: 2,
        limit: 5,
        search: 'sarah',
        status: 'approved',
      },
    }));
    expect(result).toEqual({
      status: 'success',
      data: [{ caseId: 'case-1' }],
      meta: { page: 2, limit: 5, total: 12 },
    });
  });

  it('throws when the API payload reports an error', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'error',
        message: 'History unavailable',
      },
    });

    await expect(getCaseHistory({})).rejects.toThrow('History unavailable');
  });
});
