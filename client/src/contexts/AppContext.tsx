import { normalizeRole } from "../utils/roleAccess";

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";
const USER_KEY = import.meta.env.VITE_USER_KEY || "travox-ua";

export const useApp = () => {
  const getStoredUser = () => {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)
        : null;

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const name =
          parsed.name ||
          parsed.full_name ||
          parsed.username ||
          parsed.email ||
          "User";
        return {
          id: parsed.id || parsed.userId || "",
          name,
          email: parsed.email || "",
          username: parsed.username || name,
          role: normalizeRole(parsed.role),
        };
      }
    } catch (error) {
      console.warn("Failed to parse stored user", error);
    }

    return null;
  };

  const fallbackUser = {
    id: "",
    name: "User",
    email: "",
    username: "User",
    role: normalizeRole(undefined),
  } as const;

  const user = getStoredUser() || fallbackUser;

  return {
    currentUser: user,
    authUser: user,
    logout: () => {
      // Clear local storage
      // Note: The travox-at cookie is httpOnly and on a different domain,
      // so it must be cleared server-side via /auth/logout endpoint
      sessionStorage?.removeItem(USER_KEY);
      localStorage?.removeItem(USER_KEY);
      sessionStorage?.removeItem(TOKEN_KEY);
      localStorage?.removeItem(TOKEN_KEY);
    },
    logs: [],
    bookings: [],
    customers: [],
    payments: [],
    expenses: [],
    refunds: [],
    vendors: [],
    addRefund: () => {},
    getDashboardStats: () => ({
      totalRevenue: 12500000,
      pendingAmount: 875000,
      monthlyExpense: 450000,
      activeBookings: 245,
    }),
  };
};
