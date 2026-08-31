import { apiClient } from "./apiClient";
import { tokenService } from "./tokenService";
import type { User, LoginResponseData } from "../types";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<User>("/users/register", payload),

  login: async (payload: LoginPayload) => {
    const res = await apiClient.post<LoginResponseData>(
      "/users/login",
      payload,
    );
    tokenService.set({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    });
    return res;
  },

  logout: async () => {
    await apiClient.post("/users/logout", undefined, true);
    tokenService.clear();
  },

  currentUser: () => apiClient.get<User>("/users/current-user", true),
};
