// src/utils/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface UserDto {
  id: number;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserDto;
}

export interface AuthPayload {
  email: string;
  password: string;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `Error ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message ?? json.error ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export const api = {
  register: (payload: AuthPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: AuthPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
