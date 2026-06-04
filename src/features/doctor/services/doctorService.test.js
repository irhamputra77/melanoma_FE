import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../services/api';
import { downloadCaseHistoryPdf, generateCaseReportPdf, getCaseHistory } from './doctorService';

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

  it('downloads case history PDF with active filters', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const remove = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    api.request.mockResolvedValue({
      data: new Blob(['pdf'], { type: 'application/pdf' }),
      headers: {
        'content-disposition': 'attachment; filename="history.pdf"',
        'content-type': 'application/pdf',
      },
    });

    await downloadCaseHistoryPdf({
      search: 'sarah',
      diagnosis: 'melanoma',
      status: 'approved',
      startDate: '2026-01-01',
      endDate: '2026-06-01',
    });

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'get',
      url: '/cases/history/download',
      responseType: 'blob',
      params: {
        search: 'sarah',
        diagnosis: 'melanoma',
        status: 'approved',
        startDate: '2026-01-01',
        endDate: '2026-06-01',
      },
    }));
    expect(click).toHaveBeenCalled();

    click.mockRestore();
    remove.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it('generates a case report PDF for the selected case', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const remove = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    api.request.mockResolvedValue({
      data: new Blob(['pdf'], { type: 'application/pdf' }),
      headers: {
        'content-disposition': 'attachment; filename="case.pdf"',
      },
    });

    await generateCaseReportPdf('case-1');

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'post',
      url: '/cases/case-1/report/generate',
      responseType: 'blob',
    }));
    expect(click).toHaveBeenCalled();

    click.mockRestore();
    remove.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});
