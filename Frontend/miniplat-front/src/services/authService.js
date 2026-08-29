const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const login = async (username, password) => {
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || "Login failed");
  }

  const data = await response.json();

  return {
    token: data.access_token,
    user: data.user || { username }, // fallback if user object is not provided
  };
};

export const fetchUserInfo = async (token) => {
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

  return await response.json();
};
