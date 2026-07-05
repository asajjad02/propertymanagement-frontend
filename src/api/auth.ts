/** Auth endpoint calls. These manage tokens directly; hooks live in src/hooks. */
import { apiClient } from '@/lib/api-client';
import { clearTokens, getRefreshToken, setTokens } from '@/lib/token-storage';
import type {
  LoginInput,
  MeResponse,
  RegisterInput,
  RegisterResponse,
  TokenPair,
} from '@/types/api';

export async function login(input: LoginInput): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/login/', input);
  setTokens(data);
  return data;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register/', input);
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me/');
  return data;
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
