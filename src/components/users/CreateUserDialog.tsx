import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConnectionConfig, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw, Copy, Check } from "lucide-react";
import { z } from "zod";

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

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const getRateLimitRetrySeconds = (message: string) => {
  const match = message.match(/after\s+(\d+)\s+seconds?/i);
  return match ? Number(match[1]) : null;
};

interface CreateUserDialogProps {
  onUserCreated: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("staff");
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [allDomainsSelected, setAllDomainsSelected] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Email availability state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const createUserWithClientFallback = async () => {
    const connection = getSupabaseConnectionConfig();

    const signupClient = createClient(connection.url, connection.publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: signUpData, error: signUpError } = await signupClient.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) throw new Error(signUpError.message || "Failed to create user");

    const createdUserId = signUpData.user?.id;
    if (!createdUserId) throw new Error("User was created without an ID");

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: createdUserId, role }, { onConflict: "user_id" });

    if (roleError) throw new Error(roleError.message || "Failed to assign role");

    if (selectedDomainIds.length > 0) {
      const domainRows = selectedDomainIds.map((domainId) => ({
        user_id: createdUserId,
        domain_id: domainId,
      }));

      const { error: domainsError } = await supabase.from("user_domains").insert(domainRows);

      if (domainsError) throw new Error(domainsError.message || "Failed to assign domains");
    }
  };

  const runFallbackWithRateLimitRetry = async () => {
    try {
      await createUserWithClientFallback();
      return;
    } catch (fallbackError: any) {
      const fallbackMessage =
        fallbackError?.message ||
        fallbackError?.error_description ||
        "Fallback signup failed";

      const retrySeconds = getRateLimitRetrySeconds(fallbackMessage);
      if (retrySeconds && retrySeconds > 0) {
        toast.info(`Rate limited by your Supabase auth. Retrying in ${retrySeconds} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retrySeconds * 1000));
        await createUserWithClientFallback();
        return;
      }

      throw fallbackError;
    }
  };

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
      if (data && data.length > 0 && !role) {
        setRole(data[data.length - 1].slug);
      }
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
    }
  };

  // Check email availability with debounce
  const checkEmailAvailability = useCallback(async (emailToCheck: string) => {
    // Validate email format first
    try {
      emailSchema.parse(emailToCheck);
    } catch {
      setEmailError(null);
      setEmailAvailable(null);
      return;
    }

    setIsCheckingEmail(true);
    setEmailError(null);
    setEmailAvailable(null);

    try {
      // Check if email exists in profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailToCheck.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error("Error checking email:", error);
        return;
      }

      if (data) {
        setEmailError("This email is already registered");
        setEmailAvailable(false);
      } else {
        setEmailError(null);
        setEmailAvailable(true);
      }
    } catch (err) {
      console.error("Error checking email availability:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounced email check
  useEffect(() => {
    if (!email.trim()) {
      setEmailError(null);
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      checkEmailAvailability(email);
    }, 500);

    return () => clearTimeout(timer);
  }, [email, checkEmailAvailability]);

  useEffect(() => {
    if (open) {
      fetchRoles();
      fetchDomains();
    }
  }, [open]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFullName("");
    setRole("staff");
    setSelectedDomainIds([]);
    setAllDomainsSelected(false);
    setEmailError(null);
    setEmailAvailable(null);
    setCopied(false);
  };

  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const all = lowercase + uppercase + numbers + symbols;
    
    // Ensure at least one of each type
    let pass = "";
    pass += lowercase[Math.floor(Math.random() * lowercase.length)];
    pass += uppercase[Math.floor(Math.random() * uppercase.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining 8 characters randomly
    for (let i = 0; i < 8; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the password
    const shuffled = pass.split("").sort(() => Math.random() - 0.5).join("");
    setPassword(shuffled);
    setShowPassword(true);
    setCopied(false);
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy password");
    }
  };

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
      
      setAllDomainsSelected(newIds.length === domains.length);
      return newIds;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      nameSchema.parse(fullName);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    // Check email availability before submission
    if (emailError || emailAvailable === false) {
      toast.error("This email is already registered. Please use a different email.");
      return;
    }

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

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email,
          password,
          full_name: fullName,
          role,
          domain_ids: selectedDomainIds,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Handle error responses
      if (response.error) {
        // Try to extract error message from context body
        const contextBody = (response.error as any)?.context?.body;
        const status = (response.error as any)?.context?.status;
        let errorMessage = "Failed to create user";

        if (typeof contextBody === "string") {
          try {
            const parsed = JSON.parse(contextBody);
            errorMessage = parsed?.error || errorMessage;
          } catch {
            errorMessage = contextBody || errorMessage;
          }
        } else if (contextBody && typeof contextBody === "object") {
          errorMessage = (contextBody as any)?.error || errorMessage;
        } else if (response.error.message) {
          errorMessage = response.error.message;
        }

        if (status === 404 || /not found/i.test(errorMessage)) {
          await runFallbackWithRateLimitRetry();
          toast.success(`User ${fullName} created successfully!`);
          resetForm();
          setOpen(false);
          onUserCreated();
          return;
        }

        throw new Error(errorMessage);
      }

      // Check for error in successful response data
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`User ${fullName} created successfully!`);
      resetForm();
      setOpen(false);
      onUserCreated();
    } catch (error: any) {
      const message = error?.message || "Failed to create user";
      console.error("Error creating user:", error);

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

      if (/Failed to send a request to the Edge Function|Failed to fetch/i.test(message)) {
        try {
          await runFallbackWithRateLimitRetry();
          toast.success(`User ${fullName} created successfully!`);
          resetForm();
          setOpen(false);
          onUserCreated();
          return;
        } catch (fallbackError: any) {
          console.error("Fallback user creation failed:", fallbackError);

          const fallbackMessage =
            fallbackError?.message ||
            fallbackError?.error_description ||
            "Fallback signup failed";

          if (/signup.*disabled|signups not allowed/i.test(fallbackMessage)) {
            toast.error(
              "Cannot create users because email signup is disabled on this database project and admin-create-user is unreachable. Enable email signup or switch to a project with the admin-create-user Edge Function."
            );
            return;
          }

          if (/row-level security|permission denied|violates row-level security/i.test(fallbackMessage)) {
            toast.error(`User account created but role/domain assignment failed: ${fallbackMessage}`);
            return;
          }

          toast.error(`User creation failed: ${fallbackMessage}`);
          return;
        }

        const activeConnection = getSupabaseConnectionConfig();
        let host = activeConnection.url;

        try {
          host = new URL(activeConnection.url).host;
        } catch {
          // keep original URL string
        }

        toast.error(
          `Cannot reach admin-create-user on ${host}. If you're using a custom Supabase project, deploy the admin-create-user Edge Function there or reset Database Connection to Lovable Cloud.`
        );
        return;
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gradient-primary hover:opacity-90">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system with specified role and credentials.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              placeholder="Dr. Ahmed Al-Rashid"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={emailError ? "border-destructive pr-10" : emailAvailable ? "border-green-500 pr-10" : ""}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isCheckingEmail && emailError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              )}
              {!isCheckingEmail && emailAvailable && !emailError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {emailError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {emailError}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Temporary Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={generatePassword}
              >
                <RefreshCw className="h-3 w-3" />
                Generate
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder=""
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCopied(false);
                }}
                required
                className="pr-20"
              />
              <div className="absolute right-0 top-0 h-full flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full px-2"
                  onClick={copyPassword}
                  disabled={!password}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <PasswordStrengthIndicator password={password} />
            <p className="text-xs text-muted-foreground">
              User should change this password after first login.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={rolesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
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
                  id="all-domains"
                  checked={allDomainsSelected}
                  onCheckedChange={handleAllDomainsChange}
                />
                <label
                  htmlFor="all-domains"
                  className="text-sm font-medium cursor-pointer"
                >
                  All Domains
                </label>
              </div>
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`domain-${domain.id}`}
                    checked={selectedDomainIds.includes(domain.id)}
                    onCheckedChange={() => handleDomainToggle(domain.id)}
                  />
                  <label
                    htmlFor={`domain-${domain.id}`}
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
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}