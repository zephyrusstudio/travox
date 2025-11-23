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
  private userCache = new Map<string, User>();

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
      // Cache users for quick lookup
      const normalizedUsers = response.data.map((user) => ({
        ...user,
        role: normalizeRole(user.role),
      }));

      normalizedUsers.forEach((user) => {
        this.userCache.set(user.id, user);
      });

      return { users: normalizedUsers, count: response.count };
    }

    throw new Error("Failed to fetch users");
  }

  async getUserById(id: string): Promise<User | null> {
    // Check cache first
    if (this.userCache.has(id)) {
      return this.userCache.get(id)!;
    }

    try {
      const response = await apiRequest<ApiResponse<User>>({
        method: "GET",
        url: `/users/${id}`,
      });

      if (response.status === "success") {
        // Cache the user
        const normalized = {
          ...response.data,
          role: normalizeRole(response.data.role),
        };
        this.userCache.set(id, normalized);
        return normalized;
      }
    } catch (error) {
      console.warn(`Failed to fetch user ${id}:`, error);
    }

    return null;
  }

  async getUsersByIds(ids: string[]): Promise<Map<string, User>> {
    const userMap = new Map<string, User>();
    const missingIds: string[] = [];

    // Check cache first
    ids.forEach((id) => {
      if (this.userCache.has(id)) {
        userMap.set(id, this.userCache.get(id)!);
      } else {
        missingIds.push(id);
      }
    });

    // Fetch missing users if any
    if (missingIds.length > 0) {
      try {
        // Get all users to populate cache (since there's no bulk get by IDs endpoint)
        await this.getUsers();

        // Try to get missing users from cache again
        missingIds.forEach((id) => {
          if (this.userCache.has(id)) {
            userMap.set(id, this.userCache.get(id)!);
          }
        });
      } catch (error) {
        console.warn("Failed to fetch users for dereferencing:", error);
      }
    }

    return userMap;
  }

  clearCache(): void {
    this.userCache.clear();
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
      this.userCache.set(normalized.id, normalized);
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
      this.userCache.set(normalized.id, normalized);
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
      this.userCache.set(normalized.id, normalized);
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
