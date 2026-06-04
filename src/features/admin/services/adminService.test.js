import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../services/api';
import { getAdminUsers } from './adminService';

vi.mock('../../../services/api', () => ({
  default: {
    request: vi.fn(),
  },
}));

describe('adminService.getAdminUsers', () => {
  beforeEach(() => {
    api.request.mockReset();
  });

  it('unwraps nested list responses and omits limit so backend admin settings can apply', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          data: [{ userId: 'user-1' }],
          meta: { page: 1, limit: 8, total: 1 },
        },
      },
    });

    const result = await getAdminUsers();

    expect(api.request).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3300/api/v1/admin',
      method: 'get',
      url: '/users',
      params: {
        search: undefined,
        role: undefined,
        status: undefined,
        page: 1,
        limit: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    });
    expect(result).toEqual({
      data: [{ userId: 'user-1' }],
      meta: { page: 1, limit: 8, total: 1 },
      status: 'success',
    });
  });
});
