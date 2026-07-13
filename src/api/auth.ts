/** Auth endpoint calls. These manage tokens directly; hooks live in src/hooks. */
import { apiClient } from '@/lib/api-client';
import { clearTokens, getRefreshToken, setTokens } from '@/lib/token-storage';
import type {
  AccountDetails,
  AccountUpdateInput,
  ChangePasswordInput,
  LoginInput,
  MeResponse,
  ProfileUpdateInput,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  TokenPair,
  VerifyEmailInput,
} from '@/types/api';

export async function login(input: LoginInput): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/login/', input);
  setTokens(data);
  return data;
}

/**
 * Register a user + their account. Returns no tokens — the backend emails a
 * verification code; the user must verify (below) to sign in.
 */
export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register/', input);
  return data;
}

/** Verify the email OTP. On success the backend returns the token pair. */
export async function verifyEmail(input: VerifyEmailInput): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/verify-email/', input);
  setTokens(data);
  return data;
}

/** Re-send the email-verification code (generic response, no enumeration). */
export async function resendOtp(email: string): Promise<void> {
  await apiClient.post('/auth/resend-otp/', { email });
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me/');
  return data;
}

/** Update the logged-in user's own profile (name, phone, email). */
export async function updateProfile(input: ProfileUpdateInput): Promise<MeResponse> {
  const { data } = await apiClient.patch<MeResponse>('/auth/me/', input);
  return data;
}

/** Change the logged-in user's password (requires the current one). */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.post('/auth/change-password/', input);
}

/** GET the current account's settings (society details). */
export async function fetchAccount(): Promise<AccountDetails> {
  const { data } = await apiClient.get<AccountDetails>('/account/');
  return data;
}

/** PATCH the current account's settings (admin only). */
export async function updateAccount(input: Partial<AccountUpdateInput>): Promise<AccountDetails> {
  const { data } = await apiClient.patch<AccountDetails>('/account/', input);
  return data;
}

/** Request a password-reset code by email. */
export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password/', { email });
}

/** Complete a password reset with the emailed code and a new password. */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiClient.post('/auth/reset-password/', input);
}

/**
 * Blacklist the refresh token server-side, then drop local tokens. The logout
 * endpoint accepts the refresh token even with an expired access token, so a
 * failed network call still clears the client session.
 */
export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiClient.post('/auth/logout/', { refresh });
    }
  } finally {
    clearTokens();
  }
}
