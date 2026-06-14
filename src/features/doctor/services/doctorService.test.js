import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../services/api';
import {
  downloadCaseHistoryPdf,
  generateCaseReportPdf,
  getAssignedCases,
  getCaseDetails,
  getCaseHistory,
  uploadCaseAnnotation,
} from './doctorService';

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

  it('normalizes nested case history list responses', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          data: [{ caseId: 'case-nested' }],
          meta: { page: 1, limit: 10, total: 1 },
        },
      },
    });

    const result = await getCaseHistory({ page: 1, limit: 10 });

    expect(result).toEqual({
      status: 'success',
      data: [{ caseId: 'case-nested' }],
      meta: { page: 1, limit: 10, total: 1 },
    });
  });

  it('normalizes clinical, Grad-CAM, and edited annotation image URLs in case history', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            caseId: 'case-images',
            scan: {
              imageUrl: '/uploads/scans/case-images.jpg',
              heatmapUrl: '/uploads/gradcam/case-images.png',
              annotationImageUrl: '/uploads/annotations/case-images.png',
            },
          },
        ],
        meta: { page: 1, limit: 10, total: 1 },
      },
    });

    const result = await getCaseHistory({ page: 1, limit: 10 });

    expect(result.data[0]).toEqual(expect.objectContaining({
      clinicalImageUrl: '/uploads/scans/case-images.jpg',
      gradcamUrl: '/uploads/gradcam/case-images.png',
      annotatedImageUrl: '/uploads/annotations/case-images.png',
    }));
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

  it('normalizes assigned verification request cases for the doctor dashboard', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            id: 'vr-1',
            scanId: 'SCN-1780900819998',
            status: 'pending',
            createdAt: '2026-06-09T10:00:00.000Z',
            patient: {
              name: 'Emma Wilson',
              avatarUrl: '/uploads/patients/emma.png',
            },
            scan: {
              imageUrl: '/uploads/scans/scan.png',
            },
          },
        ],
      },
    });

    const result = await getAssignedCases();

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'get',
      url: '/cases/assigned',
    }));
    expect(result).toEqual([
      expect.objectContaining({
        caseId: 'SCN-1780900819998',
        detailCaseId: 'SCN-1780900819998',
        requestId: 'vr-1',
        scanId: 'SCN-1780900819998',
        patientName: 'Emma Wilson',
        avatarUrl: '/uploads/patients/emma.png',
        status: 'pending_review',
        receivedAt: '2026-06-09T10:00:00.000Z',
      }),
    ]);
  });

  it('keeps request-only assigned cases openable through the request id fallback', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            id: 'VER-1781063819348',
            status: 'pending',
            patientName: 'Sarah Johnson',
            createdAt: '2026-06-09T10:00:00.000Z',
          },
        ],
      },
    });

    const result = await getAssignedCases();

    expect(result).toEqual([
      expect.objectContaining({
        caseId: 'VER-1781063819348',
        requestId: 'VER-1781063819348',
        detailCaseId: 'VER-1781063819348',
        patientName: 'Sarah Johnson',
        status: 'pending_review',
      }),
    ]);
  });

  it('normalizes assigned verification requests with the request-linked scan fields', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            id: 'verification-request-db-id',
            requestId: 'VER-1781411051110',
            patientScanId: '1d9bc34c-2c14-4c27-a9bf-b30c334aa540',
            caseId: 'SCN-178141105111',
            scanId: 'SCN-178141105111',
            detailCaseId: 'SCN-178141105111',
            actionCaseId: 'SCN-178141105111',
            patientName: 'Irham Kurnia Putra',
            status: 'pending',
            receivedAt: '2026-06-14T03:35:00.000Z',
            imageUrl: '/uploads/scan_1781411051110.jpg',
            bodySite: 'kepala',
            complaint: 'gatal gatal gatal gatal',
          },
        ],
      },
    });

    const result = await getAssignedCases();

    expect(result).toEqual([
      expect.objectContaining({
        requestId: 'VER-1781411051110',
        patientScanId: '1d9bc34c-2c14-4c27-a9bf-b30c334aa540',
        caseId: 'SCN-178141105111',
        scanId: 'SCN-178141105111',
        clinicalImageUrl: '/uploads/scan_1781411051110.jpg',
        scanImageUrl: '/uploads/scan_1781411051110.jpg',
        bodySite: 'kepala',
        complaint: 'gatal gatal gatal gatal',
        status: 'pending_review',
      }),
    ]);
  });

  it('filters completed assigned cases from the doctor dashboard queue', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            id: 'pending-request',
            caseId: 'SCN-pending',
            scanId: 'SCN-pending',
            patientName: 'Pending Patient',
            status: 'pending',
          },
          {
            id: 'approved-request',
            caseId: 'SCN-approved',
            scanId: 'SCN-approved',
            patientName: 'Approved Patient',
            status: 'approved',
          },
          {
            id: 'rejected-request',
            caseId: 'SCN-rejected',
            scanId: 'SCN-rejected',
            patientName: 'Rejected Patient',
            status: 'rejected',
          },
        ],
      },
    });

    const result = await getAssignedCases();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({
      caseId: 'SCN-pending',
      status: 'pending_review',
    }));
  });

  it('prioritizes detailCaseId over requestId for assigned verification request detail links', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            id: 'verification-request-db-id',
            requestId: 'VER-1781063819348',
            caseId: 'SCN-1780900819998',
            scanId: 'SCN-1780900819998',
            detailCaseId: 'SCN-1780900819998',
            actionCaseId: 'SCN-1780900819998',
            scanImageUrl: '/uploads/scans/scan.png',
            gradcamImageUrl: '/uploads/gradcam/scan.png',
            editedGradcamImageUrl: '/uploads/annotations/scan.png',
            patientName: 'Sarah Johnson',
            status: 'pending',
            receivedAt: '2026-06-10T10:00:00.000Z',
          },
        ],
      },
    });

    const result = await getAssignedCases();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'verification-request-db-id',
        requestId: 'VER-1781063819348',
        caseId: 'SCN-1780900819998',
        scanId: 'SCN-1780900819998',
        detailCaseId: 'SCN-1780900819998',
        actionCaseId: 'SCN-1780900819998',
        clinicalImageUrl: '/uploads/scans/scan.png',
        gradcamUrl: '/uploads/gradcam/scan.png',
        annotatedImageUrl: '/uploads/annotations/scan.png',
        patientName: 'Sarah Johnson',
        status: 'pending_review',
      }),
    ]);
  });

  it('normalizes doctor case image fields for the dashboard', async () => {
    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          caseId: 'case-1',
          gradcamImageUrl: '/api/uploads/gradcam-case-1.png',
          editedGradcamImageUrl: '/uploads/annotations/annotation-case-1.png',
          scan: {
            imageUrl: '/api/uploads/scan-case-1.jpg',
          },
          analysis: {
            prediction: 'Benign',
          },
        },
      },
    });

    const result = await getCaseDetails('case-1');

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'get',
      url: '/cases/case-1',
    }));
    expect(result.clinicalImage).toEqual(expect.objectContaining({
      imageUrl: '/api/uploads/scan-case-1.jpg',
      annotatedImageUrl: '/uploads/annotations/annotation-case-1.png',
    }));
    expect(result.aiPrediction).toEqual(expect.objectContaining({
      gradcamUrl: '/api/uploads/gradcam-case-1.png',
    }));
  });

  it('downloads case history PDF with active filters', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const remove = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    api.request.mockResolvedValue({
      data: new Blob(['%PDF-1.4 history'], { type: 'application/pdf' }),
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
      data: new Blob(['%PDF-1.4 case'], { type: 'application/pdf' }),
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

  it('uploads doctor annotation image as multipart form data', async () => {
    const file = new File(['annotation'], 'annotation.png', { type: 'image/png' });

    api.request.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          annotatedImageUrl: '/uploads/annotations/annotation.png',
        },
      },
    });

    const result = await uploadCaseAnnotation('case-1', file);
    const request = api.request.mock.calls[0][0];

    expect(request).toEqual(expect.objectContaining({
      method: 'post',
      url: '/cases/case-1/annotation',
    }));
    expect(request.data).toBeInstanceOf(FormData);
    expect(request.data.get('annotationImage')).toBe(file);
    expect(result).toEqual({
      status: 'success',
      message: '',
      annotatedImageUrl: '/uploads/annotations/annotation.png',
    });
  });

  it('keeps annotation upload compatible with status and message only responses', async () => {
    const file = new File(['annotation'], 'annotation.png', { type: 'image/png' });

    api.request.mockResolvedValue({
      data: {
        status: 'success',
        message: 'Coretan dokter berhasil disimpan pada data Scan',
      },
    });

    const result = await uploadCaseAnnotation('case-1', file);

    expect(result).toEqual({
      status: 'success',
      message: 'Coretan dokter berhasil disimpan pada data Scan',
      annotatedImageUrl: '',
    });
  });
});
