import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  Activity, 
  TrendingUp,
  MessageSquare,
  Clock,
  Layers
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  delay?: number;
}

function StatsCard({ title, value, description, icon: Icon, trend, delay = 0 }: StatsCardProps) {
  return (
    <Card 
      className="border-0 shadow-elegant hover:shadow-gold transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <span className="text-xs text-green-light font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface Domain {
  id: string;
  name: string;
  abbreviation: string | null;
  color: string | null;
}

// Parallel fetch all dashboard data in a single query function
const fetchDashboardData = async (userId: string | undefined, isAdmin: boolean) => {
  if (!userId) return { documentCount: 0, messageCount: 0, userName: "", userDomains: [] };

  // Execute all queries in parallel for faster loading
  const [docCountResult, msgCountResult, profileResult, domainsResult] = await Promise.all([
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase.from("chat_messages").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("full_name").eq("user_id", userId).single(),
    isAdmin
      ? supabase.from("domains").select("id, name, abbreviation, color").order("display_order")
      : supabase.from("user_domains").select("domain_id, domains(id, name, abbreviation, color)").eq("user_id", userId)
  ]);

  const userDomains = isAdmin
    ? (domainsResult.data || [])
    : (domainsResult.data || []).map((ud: any) => ud.domains).filter(Boolean);

  return {
    documentCount: docCountResult.count ?? 0,
    messageCount: msgCountResult.count ?? 0,
    userName: profileResult.data?.full_name || "",
    userDomains: userDomains as Domain[]
  };
};

export default function Dashboard() {
  const { role, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  // Use React Query with caching for instant subsequent loads
  const { data } = useQuery({
    queryKey: ["dashboard", user?.id, isAdmin],
    queryFn: () => fetchDashboardData(user?.id, isAdmin),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 5,    // Keep in cache for 5 minutes
  });

  const documentCount = data?.documentCount ?? 0;
  const messageCount = data?.messageCount ?? 0;
  const userName = data?.userName ?? "";
  const userDomains = data?.userDomains ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Hello, {userName || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to Taif Children's Hospital Data Intelligence System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Documents"
            value={documentCount}
            description="Uploaded reports & files"
            icon={FileText}
            delay={0}
          />
          <StatsCard
            title="Chat Messages"
            value={messageCount}
            description="AI assistant interactions"
            icon={MessageSquare}
            delay={100}
          />
          <StatsCard
            title="ER Status"
            value="Active"
            description="System operational"
            icon={Activity}
            trend="+12%"
            delay={200}
          />
          <StatsCard
            title="Response Time"
            value="< 2s"
            description="Average AI response"
            icon={Clock}
            delay={300}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-elegant animate-slide-up" style={{ animationDelay: "400ms" }}>
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button 
                onClick={() => navigate("/chat")}
                className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
              >
                <div className="p-3 rounded-lg gradient-primary">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Ask the AI Assistant
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Query ER reports and get instant answers
                  </p>
                </div>
              </button>

              {isAdmin && (
                <button 
                  onClick={() => navigate("/documents")}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
                >
                  <div className="p-3 rounded-lg gradient-gold">
                    <FileText className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                      Upload Documents
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add new reports, data files, and documents
                    </p>
                  </div>
                </button>
              )}

              {isAdmin && (
                <button 
                  onClick={() => navigate("/users")}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
                >
                  <div className="p-3 rounded-lg bg-green-light">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground group-hover:text-green-light transition-colors">
                      Manage Users
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Update user roles and permissions
                    </p>
                  </div>
                </button>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elegant animate-slide-up" style={{ animationDelay: "500ms" }}>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Domains
              </CardTitle>
              <CardDescription>
                {isAdmin ? "All available domains" : "Your assigned domains"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userDomains.length > 0 ? (
                  userDomains.map((domain) => (
                    <div 
                      key={domain.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: domain.color || "#6366f1" }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {domain.name}
                        </span>
                      </div>
                      {domain.abbreviation && (
                        <Badge variant="secondary" className="text-xs">
                          {domain.abbreviation}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No domains assigned
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
