import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";

interface Role {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface UserData {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  domain_ids?: string[];
}

interface EditUserDialogProps {
  user: UserData;
  onUserUpdated: () => void;
  disabled?: boolean;
}

export function EditUserDialog({ user, onUserUpdated, disabled }: EditUserDialogProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>(user.domain_ids || []);
  const [allDomainsSelected, setAllDomainsSelected] = useState(false);
  
  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchRoles = async () => {
    setRolesLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, slug, color")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
    } else {
      setRoles(data || []);
    }
    setRolesLoading(false);
  };

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from("domains")
      .select("id, name, slug, color")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching domains:", error);
    } else {
      setDomains(data || []);
      // Check if all domains are selected
      if (user.domain_ids && data && user.domain_ids.length === data.length) {
        setAllDomainsSelected(true);
      }
    }
  };

  useEffect(() => {
    if (open) {
      fetchRoles();
      fetchDomains();
      setFullName(user.full_name);
      setEmail(user.email);
      setRole(user.role);
      setSelectedDomainIds(user.domain_ids || []);
      setShowPasswordReset(false);
      setNewPassword("");
      setShowPassword(false);
    }
  }, [open, user]);

  useEffect(() => {
    if (domains.length > 0) {
      setAllDomainsSelected(selectedDomainIds.length === domains.length);
    }
  }, [selectedDomainIds, domains]);

  const handleAllDomainsChange = (checked: boolean) => {
    setAllDomainsSelected(checked);
    if (checked) {
      setSelectedDomainIds(domains.map((d) => d.id));
    } else {
      setSelectedDomainIds([]);
    }
  };

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomainIds((prev) => {
      const newIds = prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId];
      return newIds;
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsResettingPassword(true);

    try {
      if (!session?.access_token) {
        toast.error("Your session expired. Please sign in again.");
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("admin-update-user", {
        body: {
          userId: user.user_id,
          newPassword: newPassword,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contextBody = (response.error as any)?.context?.body;
      const contextStatus = (response.error as any)?.context?.status;
      let contextError: string | undefined;

      if (typeof contextBody === "string") {
        try {
          contextError = JSON.parse(contextBody)?.error;
        } catch {
          // ignore
        }
      } else if (contextBody && typeof contextBody === "object") {
        contextError = (contextBody as any)?.error;
      }

      const errorMessage =
        response.data?.error ||
        contextError ||
        response.error?.message ||
        (contextStatus ? `Request failed (${contextStatus})` : undefined);

      if (response.error || response.data?.error) {
        throw new Error(errorMessage || "Failed to reset password");
      }

      toast.success("Password reset successfully");
      setShowPasswordReset(false);
      setNewPassword("");
    } catch (error: any) {
      const message = error?.message || "Failed to reset password";
      console.error("Error resetting password:", error);

      if (/invalid token|no authorization header|session not found/i.test(message)) {
        toast.error("Your session expired. Please sign in again.");
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        navigate("/auth");
        return;
      }

      toast.error(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      if (!session?.access_token) {
        toast.error("Your session expired. Please sign in again.");
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("admin-update-user", {
        body: {
          userId: user.user_id,
          email: email !== user.email ? email : undefined,
          fullName: fullName !== user.full_name ? fullName : undefined,
          role: role !== user.role ? role : undefined,
          domainIds: selectedDomainIds,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contextBody = (response.error as any)?.context?.body;
      const contextStatus = (response.error as any)?.context?.status;
      let contextError: string | undefined;

      if (typeof contextBody === "string") {
        try {
          contextError = JSON.parse(contextBody)?.error;
        } catch {
          // ignore
        }
      } else if (contextBody && typeof contextBody === "object") {
        contextError = (contextBody as any)?.error;
      }

      const errorMessage =
        response.data?.error ||
        contextError ||
        response.error?.message ||
        (contextStatus ? `Request failed (${contextStatus})` : undefined);

      if (response.error || response.data?.error) {
        throw new Error(errorMessage || "Failed to update user");
      }

      toast.success("User updated successfully");
      setOpen(false);
      onUserUpdated();
    } catch (error: any) {
      const message = error?.message || "Failed to update user";
      console.error("Error updating user:", error);

      if (/invalid token|no authorization header|session not found/i.test(message)) {
        toast.error("Your session expired. Please sign in again.");
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        navigate("/auth");
        return;
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={rolesLoading}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder={rolesLoading ? "Loading..." : "Select role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.slug}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: r.color || "#6366f1" }}
                        />
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Domains</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="edit-all-domains"
                    checked={allDomainsSelected}
                    onCheckedChange={handleAllDomainsChange}
                  />
                  <label
                    htmlFor="edit-all-domains"
                    className="text-sm font-medium cursor-pointer"
                  >
                    All Domains
                  </label>
                </div>
                {domains.map((domain) => (
                  <div key={domain.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-domain-${domain.id}`}
                      checked={selectedDomainIds.includes(domain.id)}
                      onCheckedChange={() => handleDomainToggle(domain.id)}
                    />
                    <label
                      htmlFor={`edit-domain-${domain.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: domain.color }}
                      />
                      {domain.name}
                    </label>
                  </div>
                ))}
                {domains.length === 0 && (
                  <p className="text-sm text-muted-foreground">No domains available</p>
                )}
              </div>
            </div>

            {/* Password Reset Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </Label>
                {!showPasswordReset && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordReset(true)}
                  >
                    Reset
                  </Button>
                )}
              </div>
              {showPasswordReset && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setNewPassword("");
                      }}
                      disabled={isResettingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword || !newPassword.trim()}
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        "Confirm Reset"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}