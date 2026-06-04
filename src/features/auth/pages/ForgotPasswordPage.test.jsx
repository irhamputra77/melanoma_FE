import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { requestPasswordReset } from '../services/authService';

vi.mock('../services/authService', () => ({
  requestPasswordReset: vi.fn(),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
  });

  it('submits email and shows development reset token when provided', async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockResolvedValue({
      message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      resetToken: 'dev-token-123',
      expiresAt: '2026-05-27T10:00:00.000Z',
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com');
    });
    expect(await screen.findByText('dev-token-123')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to reset password' })).toHaveAttribute(
      'href',
      '/auth/reset-password?token=dev-token-123',
    );
  });

  it('shows validation error when email is empty', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Email harus disediakan')).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});
