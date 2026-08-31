export type AccessToken = string;
export type RefreshToken = string;

export interface User {
  id?: string | number;
  email?: string;
  username?: string;
}

export interface AuthTokens {
  accessToken?: AccessToken | null;
  refreshToken?: RefreshToken | null;
  user?: User | null;
}

export interface AuthResponse {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
  user: User;
}

export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface LoginResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
