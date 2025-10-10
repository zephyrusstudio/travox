import { apiRequest } from '../utils/apiConnector';

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  preferences?: Record<string, unknown>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
}

class UserService {
  private userCache = new Map<string, User>();

  async getUsers(): Promise<User[]> {
    const response = await apiRequest<ApiResponse<User[]>>({
      method: 'GET',
      url: '/users'
    });

    if (response.status === 'success') {
      // Cache users for quick lookup
      response.data.forEach(user => {
        this.userCache.set(user.id, user);
      });
      return response.data;
    }

    throw new Error('Failed to fetch users');
  }

  async getUserById(id: string): Promise<User | null> {
    // Check cache first
    if (this.userCache.has(id)) {
      return this.userCache.get(id)!;
    }

    try {
      const response = await apiRequest<ApiResponse<User>>({
        method: 'GET',
        url: `/users/${id}`
      });

      if (response.status === 'success') {
        // Cache the user
        this.userCache.set(id, response.data);
        return response.data;
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
    ids.forEach(id => {
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
        missingIds.forEach(id => {
          if (this.userCache.has(id)) {
            userMap.set(id, this.userCache.get(id)!);
          }
        });
      } catch (error) {
        console.warn('Failed to fetch users for dereferencing:', error);
      }
    }

    return userMap;
  }

  clearCache(): void {
    this.userCache.clear();
  }
}

export const userService = new UserService();