const USE_MOCK = true;

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
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    return data;
  }
};
