import { normalizeRole } from "../utils/roleAccess";

export const useApp = () => {
  const getStoredUser = () => {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("user") || localStorage.getItem("user")
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
      sessionStorage?.removeItem("user");
      localStorage?.removeItem("user");
      sessionStorage?.removeItem("token");
      localStorage?.removeItem("token");
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
