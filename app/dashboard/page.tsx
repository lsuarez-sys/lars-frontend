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
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  // View switch: "positions" | "users" | "both"
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
        alert("Your account was deleted. You will now be redirected to the login page.");
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
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  const selectedPosId = selectedPosition
    ? (selectedPosition.id ?? selectedPosition.position_id)
    : null;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              MySQL Data Management: Positions &amp; Users
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="text-right hidden sm:block border rounded-md px-3 py-1.5 bg-muted/40">
                <p className="text-sm font-semibold flex items-center justify-end gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                  {currentUser.username}
                  <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    You
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ID #{currentUser.id} · Role: {currentUser.role || "user"}
                </p>
              </div>
            )}
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-800">
            {success}
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b pb-3">
          <Button
            variant={activeTab === "both" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("both")}
          >
            Show All ({positions.length + users.length})
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("users")}
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Users ({users.length})
          </Button>
          <Button
            variant={activeTab === "positions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("positions")}
          >
            <Layers className="w-4 h-4 mr-2" />
            Positions ({positions.length})
          </Button>
        </div>

        {/* ======================= USERS SECTION ======================= */}
        {(activeTab === "users" || activeTab === "both") && (
          <div className="space-y-4">
            {/* User Form Card */}
            {isUserFormOpen && (
              <Card className="border-primary/40 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>
                      {editingUserId !== null
                        ? `Update User #${editingUserId}`
                        : "Create New User"}
                    </CardTitle>
                    <CardDescription>
                      {editingUserId !== null
                        ? "Edit username, role, or update password."
                        : "Add a new user directly to the MySQL users table."}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeUserForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_username">Username</Label>
                        <Input
                          id="user_username"
                          placeholder="e.g. jdoe"
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user_password">
                          {editingUserId !== null
                            ? "Password (leave blank to keep current)"
                            : "Password"}
                        </Label>
                        <Input
                          id="user_password"
                          type="password"
                          placeholder={
                            editingUserId !== null ? "Optional new password" : "••••••••"
                          }
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          required={editingUserId === null}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user_role">Role</Label>
                        <Input
                          id="user_role"
                          placeholder="e.g. user, admin, manager"
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={closeUserForm}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingUser}>
                        {submittingUser
                          ? "Saving..."
                          : editingUserId !== null
                          ? "Save User Changes"
                          : "Create User"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Selected User Details Card */}
            {selectedUser && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      User Details (#{selectedUser.id})
                      {currentUser?.id === selectedUser.id && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                          Your Account
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Fetched from MySQL via GET /users/{selectedUser.id}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">User ID</span>
                    <span className="font-medium">{selectedUser.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Username</span>
                    <span className="font-medium">{selectedUser.username}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Role</span>
                    <span className="font-medium capitalize">{selectedUser.role}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Created At</span>
                    <span className="font-medium">
                      {selectedUser.created_at
                        ? new Date(selectedUser.created_at).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users Table Card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-primary" />
                    Users Table
                  </CardTitle>
                  <CardDescription>
                    All users stored in the MySQL database (including your current user).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void fetchUsers()}
                    disabled={loadingUsers}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${loadingUsers ? "animate-spin" : ""}`}
                    />
                    Refresh Users
                  </Button>
                  <Button onClick={openCreateUserForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingUsers ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            Loading users from MySQL...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No users found. Click &quot;Add User&quot; to create one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => {
                          const isSelf = currentUser?.id === u.id;
                          return (
                            <TableRow
                              key={u.id}
                              className={isSelf ? "bg-primary/5 font-medium" : undefined}
                            >
                              <TableCell className="font-mono">{u.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{u.username}</span>
                                  {isSelf && (
                                    <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                                      You
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted text-foreground border capitalize">
                                  <Shield className="w-3 h-3 text-muted-foreground" />
                                  {u.role || "user"}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {u.created_at
                                  ? new Date(u.created_at).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleViewUser(u.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Read
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openEditUserForm(u)}
                                  >
                                    <Pencil className="w-4 h-4 mr-1" />
                                    Update
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => void handleDeleteUser(u.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===================== POSITIONS SECTION ===================== */}
        {(activeTab === "positions" || activeTab === "both") && (
          <div className="space-y-4">
            {/* Position Form Card */}
            {isPositionFormOpen && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>
                      {editingPositionId !== null
                        ? `Update Position #${editingPositionId}`
                        : "Create New Position"}
                    </CardTitle>
                    <CardDescription>
                      {editingPositionId !== null
                        ? "Modify the position code and name below."
                        : "Fill in the details to add a new position to MySQL."}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closePositionForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePositionSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position_code">Position Code</Label>
                        <Input
                          id="position_code"
                          placeholder="e.g. Pres"
                          value={positionCode}
                          onChange={(e) => setPositionCode(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position_name">Position Name</Label>
                        <Input
                          id="position_name"
                          placeholder="e.g. President"
                          value={positionName}
                          onChange={(e) => setPositionName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={closePositionForm}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingPosition}>
                        {submittingPosition
                          ? "Saving..."
                          : editingPositionId !== null
                          ? "Save Changes"
                          : "Create Position"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Selected Position Details Card */}
            {selectedPosition && selectedPosId && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Position Details (#{selectedPosId})</CardTitle>
                    <CardDescription>
                      Fetched directly from GET /positions/{selectedPosId}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPosition(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Position ID</span>
                    <span className="font-medium">{selectedPosId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Code</span>
                    <span className="font-medium">{selectedPosition.position_code}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Name</span>
                    <span className="font-medium">{selectedPosition.position_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Created At</span>
                    <span className="font-medium">
                      {selectedPosition.created_at
                        ? new Date(selectedPosition.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Positions Table Card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Positions Table
                  </CardTitle>
                  <CardDescription>
                    All organization positions stored in MySQL.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void fetchPositions()}
                    disabled={loadingPositions}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${loadingPositions ? "animate-spin" : ""}`}
                    />
                    Refresh Positions
                  </Button>
                  <Button onClick={openCreatePositionForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Position
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Position Code</TableHead>
                        <TableHead>Position Name</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingPositions ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            Loading positions...
                          </TableCell>
                        </TableRow>
                      ) : positions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No positions found. Click &quot;Create Position&quot; to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        positions.map((pos) => {
                          const rowId = pos.id ?? pos.position_id;
                          if (!rowId) return null;
                          return (
                            <TableRow key={rowId}>
                              <TableCell className="font-mono">{rowId}</TableCell>
                              <TableCell>{pos.position_code}</TableCell>
                              <TableCell>{pos.position_name}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {pos.created_at
                                  ? new Date(pos.created_at).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleViewPosition(rowId)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Read
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openEditPositionForm(pos)}
                                  >
                                    <Pencil className="w-4 h-4 mr-1" />
                                    Update
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => void handleDeletePosition(rowId)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
