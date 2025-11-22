import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Users as UsersIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { User, userService } from "../../services/userService";
import { USER_ROLES, UserRole } from "../../utils/roleAccess";
import { errorToast, successToast } from "../../utils/toasts";
import Pagination from "../ui/Pagination";

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "inactive";

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
      ? "bg-emerald-50 text-emerald-600"
      : accent === "warning"
      ? "bg-amber-50 text-amber-600"
      : "bg-blue-50 text-blue-600";

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadUsers = async () => {
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
  };

  useEffect(() => {
    void loadUsers();
  }, [currentPage, itemsPerPage]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.name, user.email]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      const matchesRole =
        roleFilter === "all" ? true : user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? user.isActive
          : !user.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const roleSummary = useMemo(
    () =>
      USER_ROLES.map((role) => ({
        role,
        count: users.filter((user) => user.role === role).length,
      })).filter((entry) => entry.count > 0),
    [users]
  );

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

      {roleSummary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roleSummary.map(({ role, count }) => (
            <span
              key={role}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-600"
            >
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {role}
              <span className="text-xs text-gray-500">({count})</span>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-gray-700">
              {currentUser?.name || currentUser?.email}
            </span>{" "}
            ({currentUser?.role})
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No users match your filters. Try adjusting the search or role
              filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Updated At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredUsers.map((user) => {
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
                    <tr key={user.id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {user.name || user.email || "Unnamed user"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.email || "No email provided"}
                          </span>
                          {isCurrentUser && (
                            <span className="mt-1 inline-flex w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value as UserRole
                            )
                          }
                          disabled={isUpdatingRole || isCurrentUser}
                          className={`w-40 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isCurrentUser
                              ? "border-gray-200 bg-gray-50 text-gray-400"
                              : "border-gray-200 text-gray-700"
                          }`}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(user.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (canModifyStatus) {
                                void toggleUserStatus(user);
                              }
                            }}
                            disabled={isUpdatingStatus || !canModifyStatus}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isActive
                                ? "bg-emerald-600"
                                : "bg-gray-200"
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
                              user.isActive ? "text-emerald-600" : "text-gray-500"
                            }`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400">(You)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default UserManagement;
