import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import { resetPassword } from '../services/authService';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../services/authService', () => ({
  resetPassword: vi.fn(),
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    resetPassword.mockReset();
  });

  it('resets password with token from query string', async () => {
    const user = userEvent.setup();
    resetPassword.mockResolvedValue({
      message: 'Password berhasil direset',
    });

    render(
      <MemoryRouter initialEntries={['/auth/reset-password?token=reset-token-123']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('New Password'), 'newpassword123');
    await user.type(screen.getByPlaceholderText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        token: 'reset-token-123',
        password: 'newpassword123',
      });
    });
    expect(await screen.findByText('Password berhasil direset')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Password updated' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', '/auth/login');
    expect(screen.queryByPlaceholderText('New Password')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset Password' })).not.toBeInTheDocument();
  });

  it('validates password confirmation before submitting', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/auth/reset-password?token=reset-token-123']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('New Password'), 'newpassword123');
    await user.type(screen.getByPlaceholderText('Confirm New Password'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Konfirmasi password tidak sama.')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('shows backend error when new password matches the old password', async () => {
    const user = userEvent.setup();
    resetPassword.mockRejectedValue({
      response: {
        data: {
          message: 'Password baru harus berbeda dari password sebelumnya',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/auth/reset-password?token=reset-token-123']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('New Password'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm New Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Password baru harus berbeda dari password sebelumnya')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });
});
