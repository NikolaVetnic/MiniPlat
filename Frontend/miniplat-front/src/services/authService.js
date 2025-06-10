const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USE_MOCK = false;

const users = {
  USRa: {
    username: "USRa",
    name: "User A",
    firstName: "1st Test User",
    lastName: "User A",
  },
  USRb: {
    username: "USRb",
    name: "User B",
    firstName: "2nd Test User",
    lastName: "User B",
  },
};

export const login = async (username, password) => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (username === "USRa" && password === "a") {
      return {
        token: "mock-token-USRa",
        user: users.USRa,
      };
    } else if (username === "USRb" && password === "b") {
      return {
        token: "mock-token-USRb",
        user: users.USRb,
      };
    } else {
      throw new Error("Login failed: Invalid credentials");
    }
  } else {
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
  }
};
