import { apiRequest } from "../utils/apiConnector";
import { normalizeRole, UserRole } from "../utils/roleAccess";

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  preferences?: Record<string, unknown>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  count?: number;
}

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: unknown };
    if (typeof candidate.message === "string") {
      return candidate.message;
    }
  }
  return fallback;
};

class UserService {
  async getUsers(limit?: number, offset?: number): Promise<{ users: User[]; count?: number }> {
    const params: Record<string, number> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await apiRequest<ApiResponse<User[]>>({
      method: "GET",
      url: "/users",
      params,
    });

    if (response.status === "success") {
      const normalizedUsers = response.data.map((user) => ({
        ...user,
        role: normalizeRole(user.role),
      }));

      return { users: normalizedUsers, count: response.count };
    }

    throw new Error("Failed to fetch users");
  }

  async getUserById(id: string): Promise<User | null> {

    try {
      const response = await apiRequest<ApiResponse<User>>({
        method: "GET",
        url: `/users/${id}`,
      });

      if (response.status === "success") {
        const normalized = {
          ...response.data,
          role: normalizeRole(response.data.role),
        };
        return normalized;
      }
    } catch (error) {
      console.warn(`Failed to fetch user ${id}:`, error);
    }

    return null;
  }

  async getUsersByIds(ids: string[]): Promise<Map<string, User>> {
    const userMap = new Map<string, User>();

    // Fetch all users
    if (ids.length > 0) {
      try {
        // Get all users (since there's no bulk get by IDs endpoint)
        const { users } = await this.getUsers();

        // Map requested users
        ids.forEach((id) => {
          const user = users.find(u => u.id === id);
          if (user) {
            userMap.set(id, user);
          }
        });
      } catch (error) {
        console.warn("Failed to fetch users for dereferencing:", error);
      }
    }

    return userMap;
  }

  async changeRole(userId: string, role: UserRole): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>({
      method: "PATCH",
      url: "/users/change-role",
      data: { userId, role },
    });

    if (response?.status === "success") {
      const normalized = {
        ...response.data,
        role: normalizeRole(response.data.role),
      };
      return normalized;
    }

    const message = extractErrorMessage(
      response && typeof response === "object"
        ? (response as { data?: unknown }).data
        : undefined,
      "Failed to update user role"
    );
    throw new Error(message);
  }

  async activateUser(userId: string): Promise<User> {
    const response = await apiRequest<
      ApiResponse<{ message: string; user: User }>
    >({
      method: "PATCH",
      url: `/users/${userId}/activate`,
    });

    if (response?.status === "success" && response.data?.user) {
      const normalized = {
        ...response.data.user,
        role: normalizeRole(response.data.user.role),
      };
      return normalized;
    }

    const message = extractErrorMessage(
      response && typeof response === "object"
        ? (response as { data?: unknown }).data
        : undefined,
      "Failed to activate user"
    );
    throw new Error(message);
  }

  async deactivateUser(userId: string): Promise<User> {
    const response = await apiRequest<
      ApiResponse<{ message: string; user: User }>
    >({
      method: "PATCH",
      url: `/users/${userId}/deactivate`,
    });

    if (response?.status === "success" && response.data?.user) {
      const normalized = {
        ...response.data.user,
        role: normalizeRole(response.data.user.role),
      };
      return normalized;
    }

    const message = extractErrorMessage(
      response && typeof response === "object"
        ? (response as { data?: unknown }).data
        : undefined,
      "Failed to deactivate user"
    );
    throw new Error(message);
  }
}

export const userService = new UserService();
