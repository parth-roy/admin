// Token storage keys
const ACCESS_TOKEN_KEY = 'parther_admin_access_token';
const REFRESH_TOKEN_KEY = 'parther_admin_refresh_token';

export const authStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};
