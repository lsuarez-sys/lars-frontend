// app/dashboard/page.tsx
"use client";

import { clearTokens, getCurrentUser, DecodedUser } from "@/lib/auth";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Layers,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  User as UserIcon,
  Users as UsersIcon,
  X,
  Sparkles,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Position {
  id: number;
  position_code: string;
  position_name: string;
  position_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface UserItem {
  id: number;
  username: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [currentUser, setCurrentUser] = useState<DecodedUser | null>(null);

  // Tabs: "positions" | "users" | "both"
  const [activeTab, setActiveTab] = useState<"positions" | "users" | "both">("both");

  // Notifications
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Positions state
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [submittingPosition, setSubmittingPosition] = useState(false);
  const [isPositionFormOpen, setIsPositionFormOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<number | null>(null);
  const [positionCode, setPositionCode] = useState("");
  const [positionName, setPositionName] = useState("");

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userUsername, setUserUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("user");

  // Load current user from token
  useEffect(() => {
    if (!isChecking) {
      setCurrentUser(getCurrentUser());
    }
  }, [isChecking]);

  // Fetch Positions
  const fetchPositions = useCallback(async () => {
    setLoadingPositions(true);
    try {
      const data = await apiClient<Position[]>(CONFIG.ENDPOINTS.POSITIONS, {
        method: "GET",
        requiresAuth: true,
      });
      setPositions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch positions.";
      setError(message);
    } finally {
      setLoadingPositions(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await apiClient<UserItem[]>(CONFIG.ENDPOINTS.USERS, {
        method: "GET",
        requiresAuth: true,
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch users.";
      setError(message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isChecking) return;

    const timer = window.setTimeout(() => {
      void fetchPositions();
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchPositions, fetchUsers, isChecking]);

  // Logout handler
  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // ===================== POSITIONS HANDLERS =====================
  const handleViewPosition = async (positionId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Position>(`${CONFIG.ENDPOINTS.POSITIONS}/${positionId}`, {
        method: "GET",
        requiresAuth: true,
      });
      setSelectedPosition(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load position details.";
      setError(message);
    }
  };

  const openCreatePositionForm = () => {
    setEditingPositionId(null);
    setPositionCode("");
    setPositionName("");
    setSelectedPosition(null);
    setError("");
    setSuccess("");
    setIsPositionFormOpen(true);
  };

  const openEditPositionForm = (position: Position) => {
    const posId = position.id ?? position.position_id;
    if (!posId) return;
    setEditingPositionId(posId);
    setPositionCode(position.position_code);
    setPositionName(position.position_name);
    setSelectedPosition(null);
    setError("");
    setSuccess("");
    setIsPositionFormOpen(true);
  };

  const closePositionForm = () => {
    setIsPositionFormOpen(false);
    setEditingPositionId(null);
    setPositionCode("");
    setPositionName("");
  };

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPosition(true);
    setError("");
    setSuccess("");

    try {
      if (editingPositionId !== null) {
        await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${editingPositionId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            position_code: positionCode,
            position_name: positionName,
          }),
        });
        setSuccess(`Position #${editingPositionId} updated successfully.`);
      } else {
        await apiClient(CONFIG.ENDPOINTS.POSITIONS, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            position_code: positionCode,
            position_name: positionName,
          }),
        });
        setSuccess("New position created successfully.");
      }

      closePositionForm();
      await fetchPositions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Operation failed.";
      setError(message);
    } finally {
      setSubmittingPosition(false);
    }
  };

  const handleDeletePosition = async (positionId: number) => {
    const confirmed = window.confirm(`Are you sure you want to delete Position #${positionId}?`);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${positionId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      const selectedId = selectedPosition?.id ?? selectedPosition?.position_id;
      if (selectedId === positionId) {
        setSelectedPosition(null);
      }
      setSuccess(`Position #${positionId} deleted successfully.`);
      await fetchPositions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete position.";
      setError(message);
    }
  };

  // ===================== USERS HANDLERS =====================
  const handleViewUser = async (userId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<UserItem>(`${CONFIG.ENDPOINTS.USERS}/${userId}`, {
        method: "GET",
        requiresAuth: true,
      });
      setSelectedUser(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load user details.";
      setError(message);
    }
  };

  const openCreateUserForm = () => {
    setEditingUserId(null);
    setUserUsername("");
    setUserPassword("");
    setUserRole("user");
    setSelectedUser(null);
    setError("");
    setSuccess("");
    setIsUserFormOpen(true);
  };

  const openEditUserForm = (user: UserItem) => {
    setEditingUserId(user.id);
    setUserUsername(user.username);
    setUserPassword("");
    setUserRole(user.role || "user");
    setSelectedUser(null);
    setError("");
    setSuccess("");
    setIsUserFormOpen(true);
  };

  const closeUserForm = () => {
    setIsUserFormOpen(false);
    setEditingUserId(null);
    setUserUsername("");
    setUserPassword("");
    setUserRole("user");
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUser(true);
    setError("");
    setSuccess("");

    try {
      if (editingUserId !== null) {
        const payload: { username: string; role: string; password?: string } = {
          username: userUsername,
          role: userRole,
        };
        if (userPassword.trim()) {
          payload.password = userPassword;
        }

        await apiClient(`${CONFIG.ENDPOINTS.USERS}/${editingUserId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify(payload),
        });
        setSuccess(`User #${editingUserId} updated successfully.`);
      } else {
        await apiClient(CONFIG.ENDPOINTS.USERS, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            username: userUsername,
            password: userPassword,
            role: userRole,
          }),
        });
        setSuccess(`New user "${userUsername}" created successfully.`);
      }

      closeUserForm();
      await fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "User operation failed.";
      setError(message);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const isSelf = currentUser?.id === userId;
    const promptMessage = isSelf
      ? `WARNING: You are about to delete your OWN account (ID #${userId})! You will be logged out immediately. Proceed?`
      : `Are you sure you want to delete User #${userId}?`;

    const confirmed = window.confirm(promptMessage);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiClient(`${CONFIG.ENDPOINTS.USERS}/${userId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }

      if (isSelf) {
        alert("Your account was deleted. Redirecting to login...");
        handleLogout();
        return;
      }

      setSuccess(`User #${userId} deleted successfully.`);
      await fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete user.";
      setError(message);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="backdrop-blur-xl bg-white/70 border border-purple-200/50 rounded-2xl px-6 py-4 shadow-sm text-purple-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
          <span className="text-sm font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  const selectedPosId = selectedPosition
    ? (selectedPosition.id ?? selectedPosition.position_id)
    : null;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Floating Minimalist Header */}
        <header className="backdrop-blur-xl bg-white/75 dark:bg-purple-950/40 border border-white/60 dark:border-purple-800/30 rounded-3xl p-5 shadow-sm shadow-purple-900/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-purple-950 dark:text-purple-100">
                Dashboard
              </h1>
            </div>
            <p className="text-xs text-purple-700/80 dark:text-purple-300/80 font-medium pl-4.5">
              Minimalist Lavender Edition · MySQL Live Connection
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200/70 dark:border-purple-800/50 rounded-2xl px-3.5 py-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                  {currentUser.username.charAt(0)}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-semibold text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                    {currentUser.username}
                    <span className="text-[10px] uppercase font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded-full">
                      You
                    </span>
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 capitalize">
                    {currentUser.role || "user"} · #{currentUser.id}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-2xl border-purple-200/80 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-purple-900 dark:text-purple-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </header>

        {/* Status Alerts */}
        {error && (
          <div className="backdrop-blur-md bg-red-50/90 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-2xl text-xs font-medium shadow-xs flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-red-500 hover:bg-transparent"
              onClick={() => setError("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        {success && (
          <div className="backdrop-blur-md bg-purple-50/90 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100 px-4 py-3 rounded-2xl text-xs font-medium shadow-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              {success}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-purple-600 hover:bg-transparent"
              onClick={() => setSuccess("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Minimalist Segmented Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex p-1 bg-white/70 dark:bg-purple-950/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-purple-800/40 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("both")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "both"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-800 dark:text-purple-300 hover:bg-purple-100/50"
              }`}
            >
              Overview ({positions.length + users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "users"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-800 dark:text-purple-300 hover:bg-purple-100/50"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5" />
              Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("positions")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "positions"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-800 dark:text-purple-300 hover:bg-purple-100/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Positions ({positions.length})
            </button>
          </div>
        </div>

        {/* ======================= USERS SECTION ======================= */}
        {(activeTab === "users" || activeTab === "both") && (
          <section className="space-y-4">
            {/* User Form Card (Minimalist Glass) */}
            {isUserFormOpen && (
              <div className="backdrop-blur-xl bg-white/85 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-6 shadow-md shadow-purple-900/5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-purple-950 dark:text-purple-100">
                      {editingUserId !== null ? `Edit User #${editingUserId}` : "Add New User"}
                    </h3>
                    <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                      Write directly to the MySQL users table.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-purple-600 hover:bg-purple-100/60"
                    onClick={closeUserForm}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="user_username" className="text-xs text-purple-900 font-semibold">
                        Username
                      </Label>
                      <Input
                        id="user_username"
                        placeholder="e.g. emily"
                        value={userUsername}
                        onChange={(e) => setUserUsername(e.target.value)}
                        required
                        className="bg-white/80 dark:bg-purple-900/30 border-purple-200/70 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="user_password" className="text-xs text-purple-900 font-semibold">
                        {editingUserId !== null ? "Password (optional update)" : "Password"}
                      </Label>
                      <Input
                        id="user_password"
                        type="password"
                        placeholder={editingUserId !== null ? "Leave blank to keep" : "••••••••"}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        required={editingUserId === null}
                        className="bg-white/80 dark:bg-purple-900/30 border-purple-200/70 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="user_role" className="text-xs text-purple-900 font-semibold">
                        Role
                      </Label>
                      <Input
                        id="user_role"
                        placeholder="user, admin, manager"
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        required
                        className="bg-white/80 dark:bg-purple-900/30 border-purple-200/70 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={closeUserForm}
                      className="rounded-xl border-purple-200 text-purple-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingUser}
                      className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
                    >
                      {submittingUser ? "Saving..." : editingUserId !== null ? "Update User" : "Create User"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Selected User Details (Minimalist Pill Grid) */}
            {selectedUser && (
              <div className="backdrop-blur-xl bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200/80 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                      User Details (#{selectedUser.id})
                    </span>
                    {currentUser?.id === selectedUser.id && (
                      <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        Your Session
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-purple-600 hover:bg-purple-200/50 rounded-full"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/70 dark:bg-purple-900/30 p-3.5 rounded-2xl border border-white/60">
                  <div>
                    <span className="text-purple-600/80 block font-medium">ID</span>
                    <span className="font-semibold text-purple-950">{selectedUser.id}</span>
                  </div>
                  <div>
                    <span className="text-purple-600/80 block font-medium">Username</span>
                    <span className="font-semibold text-purple-950">{selectedUser.username}</span>
                  </div>
                  <div>
                    <span className="text-purple-600/80 block font-medium">Role</span>
                    <span className="font-semibold text-purple-950 capitalize">{selectedUser.role}</span>
                  </div>
                  <div>
                    <span className="text-purple-600/80 block font-medium">Registered</span>
                    <span className="font-semibold text-purple-950">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Users Card */}
            <div className="backdrop-blur-xl bg-white/75 dark:bg-purple-950/40 border border-white/60 dark:border-purple-800/30 rounded-3xl p-6 shadow-sm shadow-purple-900/5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-purple-950 dark:text-purple-100">
                      Users Directory
                    </h2>
                    <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                      All registered users in MySQL (including your own account)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchUsers()}
                    disabled={loadingUsers}
                    className="rounded-2xl border-purple-200/80 text-purple-800 hover:bg-purple-100/60 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingUsers ? "animate-spin text-purple-600" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreateUserForm}
                    className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add User
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-purple-100/80 dark:border-purple-900/40 overflow-hidden bg-white/40 dark:bg-purple-950/20">
                <Table>
                  <TableHeader className="bg-purple-50/70 dark:bg-purple-900/30">
                    <TableRow className="border-b border-purple-100/80 dark:border-purple-900/40">
                      <TableHead className="w-[70px] text-xs font-bold text-purple-900 uppercase">ID</TableHead>
                      <TableHead className="text-xs font-bold text-purple-900 uppercase">Username</TableHead>
                      <TableHead className="text-xs font-bold text-purple-900 uppercase">Role</TableHead>
                      <TableHead className="text-xs font-bold text-purple-900 uppercase">Created</TableHead>
                      <TableHead className="text-right text-xs font-bold text-purple-900 uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-xs text-purple-600/80">
                          Fetching users from MySQL...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-xs text-purple-700/80">
                          No users found in database.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => {
                        const isSelf = currentUser?.id === u.id;
                        return (
                          <TableRow
                            key={u.id}
                            className={`border-b border-purple-100/50 hover:bg-purple-50/50 transition-colors ${
                              isSelf ? "bg-purple-100/40 font-medium" : ""
                            }`}
                          >
                            <TableCell className="font-mono text-xs text-purple-700">#{u.id}</TableCell>
                            <TableCell className="text-xs font-semibold text-purple-950">
                              <div className="flex items-center gap-2">
                                <span>{u.username}</span>
                                {isSelf && (
                                  <span className="text-[10px] uppercase font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                    You
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/60 capitalize">
                                <Shield className="w-2.5 h-2.5 text-purple-600" />
                                {u.role || "user"}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-purple-600/80">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleViewUser(u.id)}
                                  className="h-7 px-2 text-xs text-purple-700 hover:bg-purple-100/80 rounded-lg"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Read
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditUserForm(u)}
                                  className="h-7 px-2 text-xs text-purple-800 hover:bg-purple-100/80 rounded-lg"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleDeleteUser(u.id)}
                                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        )}

        {/* ===================== POSITIONS SECTION ===================== */}
        {(activeTab === "positions" || activeTab === "both") && (
          <section className="space-y-4">
            {/* Position Form Card */}
            {isPositionFormOpen && (
              <div className="backdrop-blur-xl bg-white/85 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-6 shadow-md shadow-purple-900/5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-purple-950 dark:text-purple-100">
                      {editingPositionId !== null ? `Edit Position #${editingPositionId}` : "Create New Position"}
                    </h3>
                    <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                      Add or modify positions stored in the MySQL database.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-purple-600 hover:bg-purple-100/60"
                    onClick={closePositionForm}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handlePositionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="position_code" className="text-xs text-purple-900 font-semibold">
                        Position Code
                      </Label>
                      <Input
                        id="position_code"
                        placeholder="e.g. MGR"
                        value={positionCode}
                        onChange={(e) => setPositionCode(e.target.value)}
                        required
                        className="bg-white/80 dark:bg-purple-900/30 border-purple-200/70 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="position_name" className="text-xs text-purple-900 font-semibold">
                        Position Name
                      </Label>
                      <Input
                        id="position_name"
                        placeholder="e.g. Operations Manager"
                        value={positionName}
                        onChange={(e) => setPositionName(e.target.value)}
                        required
                        className="bg-white/80 dark:bg-purple-900/30 border-purple-200/70 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={closePositionForm}
                      className="rounded-xl border-purple-200 text-purple-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingPosition}
                      className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
                    >
                      {submittingPosition ? "Saving..." : editingPositionId !== null ? "Save Changes" : "Create Position"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Selected Position Details */}
            {selectedPosition && selectedPosId && (
              <div className="backdrop-blur-xl bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200/80 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Position Details (#{selectedPosId})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-purple-600 hover:bg-purple-200/50 rounded-full"
                    onClick={() => setSelectedPosition(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/70 dark:bg-purple-900/30 p-3.5 rounded-2xl border border-white/60">
                  <div>
                    <span className="text-purple-600/80 block font-medium">Position ID</span>
                    <span className="font-semibold text-purple-950">{selectedPosId}</span>
                  </div>
                  <div>
                    <span className="text-purple-600/80 block font-medium">Code</span>
                    <span className="font-semibold text-purple-950">{selectedPosition.position_code}</span>
                  </div>
                  <div>
                    <span className="text-purple-600/80 block font-medium">Name</span>
                    <span className="font-semibold text-purple-950">{selectedPosition.position_name}</span>
                  </div>
                  <div>
                    <span className="text-purple-600/80 block font-medium">Created</span>
                    <span className="font-semibold text-purple-950">
                      {selectedPosition.created_at ? new Date(selectedPosition.created_at).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Positions Card */}
            <div className="backdrop-blur-xl bg-white/75 dark:bg-purple-950/40 border border-white/60 dark:border-purple-800/30 rounded-3xl p-6 shadow-sm shadow-purple-900/5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-purple-950 dark:text-purple-100">
                      Positions Table
                    </h2>
                    <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                      Organization positions stored in the MySQL positions table
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchPositions()}
                    disabled={loadingPositions}
                    className="rounded-2xl border-purple-200/80 text-purple-800 hover:bg-purple-100/60 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingPositions ? "animate-spin text-purple-600" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreatePositionForm}
                    className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Position
                  </Button>
                </div>
              </div>

              {/* Positions Table */}
              <div className="rounded-2xl border border-purple-100/80 dark:border-purple-900/40 overflow-hidden bg-white/40 dark:bg-purple-950/20">
                <Table>
                  <TableHeader className="bg-purple-50/70 dark:bg-purple-900/30">
                    <TableRow className="border-b border-purple-100/80 dark:border-purple-900/40">
                      <TableHead className="w-[70px] text-xs font-bold text-purple-900 uppercase">ID</TableHead>
                      <TableHead className="text-xs font-bold text-purple-900 uppercase">Code</TableHead>
                      <TableHead className="text-xs font-bold text-purple-900 uppercase">Position Name</TableHead>
                      <TableHead className="text-xs font-bold text-purple-900 uppercase">Created</TableHead>
                      <TableHead className="text-right text-xs font-bold text-purple-900 uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPositions ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-xs text-purple-600/80">
                          Fetching positions from MySQL...
                        </TableCell>
                      </TableRow>
                    ) : positions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-xs text-purple-700/80">
                          No positions found in database.
                        </TableCell>
                      </TableRow>
                    ) : (
                      positions.map((pos) => {
                        const rowId = pos.id ?? pos.position_id;
                        if (!rowId) return null;
                        return (
                          <TableRow
                            key={rowId}
                            className="border-b border-purple-100/50 hover:bg-purple-50/50 transition-colors"
                          >
                            <TableCell className="font-mono text-xs text-purple-700">#{rowId}</TableCell>
                            <TableCell className="text-xs font-semibold text-purple-950">{pos.position_code}</TableCell>
                            <TableCell className="text-xs text-purple-900">{pos.position_name}</TableCell>
                            <TableCell className="text-xs text-purple-600/80">
                              {pos.created_at ? new Date(pos.created_at).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleViewPosition(rowId)}
                                  className="h-7 px-2 text-xs text-purple-700 hover:bg-purple-100/80 rounded-lg"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Read
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditPositionForm(pos)}
                                  className="h-7 px-2 text-xs text-purple-800 hover:bg-purple-100/80 rounded-lg"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleDeletePosition(rowId)}
                                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
