import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Users,
  Users as UsersIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { User, userService } from "../../services/userService";
import { USER_ROLES, UserRole } from "../../utils/roleAccess";
import { errorToast, successToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Table, { TableBody, TableCell, TableHeader, TableRow } from "../ui/Table";

interface PendingAction {
  userId: string;
  kind: "role" | "status";
}

const formatDateTime = (value?: string) => {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Never";
  }
  return parsed.toLocaleString();
};

const StatCard: React.FC<{
  label: string;
  value: number | string;
  accent?: "primary" | "success" | "warning";
  icon: React.ReactNode;
}> = ({ label, value, accent = "primary", icon }) => {
  const accentClasses =
    accent === "success"
      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
      : accent === "warning"
      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
      : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";

  return (
    <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
      <div className={`rounded-full p-3 ${accentClasses}`}>{icon}</div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await userService.getUsers(itemsPerPage, offset);
      setUsers(response.users);
      // Use count from API response if available
      setTotalItems(response.count ?? response.users.length);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load users";
      errorToast(message);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  const handleRoleChange = async (user: User, nextRole: UserRole) => {
    if (!nextRole || user.role === nextRole) {
      return;
    }

    setPendingAction({ userId: user.id, kind: "role" });
    try {
      const updatedUser = await userService.changeRole(user.id, nextRole);
      setUsers((prev) =>
        prev.map((entry) => (entry.id === user.id ? updatedUser : entry))
      );
      successToast(
        `${updatedUser.name || updatedUser.email} is now ${nextRole}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update user role";
      errorToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const toggleUserStatus = async (user: User) => {
    setPendingAction({ userId: user.id, kind: "status" });
    try {
      const updatedUser = user.isActive
        ? await userService.deactivateUser(user.id)
        : await userService.activateUser(user.id);

      setUsers((prev) =>
        prev.map((entry) => (entry.id === user.id ? updatedUser : entry))
      );

      successToast(
        `${updatedUser.name || updatedUser.email} ${
          updatedUser.isActive ? "activated" : "deactivated"
        } successfully`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${user.isActive ? "deactivate" : "activate"} user`;
      errorToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-sm text-gray-500">
            Control who can access different parts of your workspace and adjust
            their privileges in real time.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => void loadUsers()}
            icon={RefreshCw}
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm col-span-2">
          <div className="truncate">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-fit" title={currentUser?.username || currentUser?.name}>
              {currentUser?.username || currentUser?.name || "Unknown"}
            </p>
          </div>
          <div className="rounded-full p-3 bg-indigo-50 dark:bg-indigo-900/30 font-semibold text-indigo-600 dark:text-indigo-400">
            {currentUser?.role || "User"}
          </div>
        </div>
        <StatCard
          label="Total members"
          value={totalUsers}
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Active users"
          value={activeUsers}
          accent="success"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Inactive users"
          value={inactiveUsers}
          accent="warning"
          icon={<ShieldOff className="h-5 w-5" />}
        />
      </div>

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading users...</span>
            </div>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Users Found
          </h3>
          <p className="text-gray-500">
            No users found.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Member</TableCell>
                  <TableCell header>Role</TableCell>
                  <TableCell header>Created At</TableCell>
                  <TableCell header>Updated At</TableCell>
                  <TableCell header>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isUpdatingRole =
                    pendingAction?.userId === user.id &&
                    pendingAction.kind === "role";
                  const isUpdatingStatus =
                    pendingAction?.userId === user.id &&
                    pendingAction.kind === "status";
                  const isCurrentUser =
                    currentUser?.id && currentUser.id === user.id;
                  const canModifyStatus = !isCurrentUser;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name || user.email || "Unnamed user"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email || "No email provided"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={user.role}
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value as UserRole
                            )
                          }
                          disabled={isUpdatingRole || isCurrentUser}
                          className={`w-40 border px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                            isCurrentUser
                              ? "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(user.updatedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (canModifyStatus) {
                                void toggleUserStatus(user);
                              }
                            }}
                            disabled={isUpdatingStatus || !canModifyStatus}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isActive
                                ? "bg-emerald-600"
                                : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                                user.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                          {isUpdatingStatus ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <span className={`text-sm font-medium ${
                              user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
