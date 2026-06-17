import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { register, getActiveClinics } from '../services/authService';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../services/authService', () => ({
  register: vi.fn(),
  getActiveClinics: vi.fn(),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    register.mockReset();
    getActiveClinics.mockReset();
    getActiveClinics.mockResolvedValue([]);
  });

  it('submits patient registration and returns to login', async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({});

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Name'), 'Sarah Johnson');
    await user.type(screen.getByPlaceholderText('Email Address'), 'sarah@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '08123456789');
    await user.type(screen.getByPlaceholderText('Birth Date'), '1996-04-23');
    await user.selectOptions(screen.getByRole('combobox'), 'female');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'secret123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        role: 'patient',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        gender: 'female',
        password: 'secret123',
        phone: '08123456789',
        birthDate: '1996-04-23',
      });
    });
    expect(navigateMock).toHaveBeenCalledWith('/auth/login');
  });

  it('normalizes phone number before submitting registration', async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({});

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Name'), 'Sarah Johnson');
    await user.type(screen.getByPlaceholderText('Email Address'), 'sarah@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '+62 812-3456-7890');
    await user.type(screen.getByPlaceholderText('Birth Date'), '1996-04-23');
    await user.selectOptions(screen.getByRole('combobox'), 'female');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'secret123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(expect.objectContaining({
        phone: '+6281234567890',
      }));
    });
  });

  it('shows a friendly error when phone number is too short', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Name'), 'Sarah Johnson');
    await user.type(screen.getByPlaceholderText('Email Address'), 'sarah@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '08123');
    await user.type(screen.getByPlaceholderText('Birth Date'), '1996-04-23');
    await user.selectOptions(screen.getByRole('combobox'), 'female');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'secret123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Nomor telepon minimal 10 digit.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('moves doctor registration into the profile completion step', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Doctor Clinical management/i }));
    await user.type(screen.getByPlaceholderText('Name'), 'Dr Elena Aris');
    await user.type(screen.getByPlaceholderText('Email Address'), 'elena@example.com');
    await user.selectOptions(screen.getByRole('combobox'), 'female');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'secret123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Complete your profile')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('shows clinic dropdown for doctor profile step', async () => {
    const user = userEvent.setup();
    getActiveClinics.mockResolvedValue([
      { clinicId: 'uuid-clinic', name: 'Melanoma Care Clinic' },
    ]);

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Doctor Clinical management/i }));
    await user.type(screen.getByPlaceholderText('Name'), 'Dr Elena Aris');
    await user.type(screen.getByPlaceholderText('Email Address'), 'elena@example.com');
    await user.selectOptions(screen.getByRole('combobox'), 'female');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'secret123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Complete your profile')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Melanoma Care Clinic/i })).toBeInTheDocument();
  });
});
