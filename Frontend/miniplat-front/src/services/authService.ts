import type { TokenErrorResponse, TokenResponse, UserInfo } from "../types/api";
import type { SessionUser } from "../types/app";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginResult {
  token: string;
  user: SessionUser;
}

export const login = async (
  username: string,
  password: string
): Promise<LoginResult> => {
  const response = await fetch(`${API_BASE_URL}/api/Auth/Token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password,
    }),
  });

  if (!response.ok) {
    const errorData = (await response
      .json()
      .catch(() => ({}))) as TokenErrorResponse;

    throw new Error(errorData.error_description || "Login failed");
  }

  const data = (await response.json()) as TokenResponse;

  // The token endpoint answers with the OAuth2 fields only - it carries no user object,
  // and the server adds no custom parameter either. The username from the form is all
  // the session needs; the rest of the profile comes from fetchUserInfo.
  return {
    token: data.access_token,
    user: { username },
  };
};

export const fetchUserInfo = async (token: string): Promise<UserInfo> => {
  const response = await fetch(`${API_BASE_URL}/api/Auth/UserInfo`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch user info: ${response.status} - ${errorText}`
    );
  }

  return (await response.json()) as UserInfo;
};
