import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { login } from '../services/authService';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../services/authService', () => ({
  login: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    login.mockReset();
  });

  it('stores auth data and redirects based on the returned role', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      data: {
        accessToken: 'token-123',
        user: { role: 'doctor' },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email Address'), 'doctor@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'doctor@example.com',
        password: 'secret123',
      });
    });
    expect(localStorage.getItem('token')).toBe('token-123');
    expect(localStorage.getItem('role')).toBe('doctor');
    expect(navigateMock).toHaveBeenCalledWith('/doctor/dashboard');
  });

  it('shows an API error when login fails', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email Address'), 'bad@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
