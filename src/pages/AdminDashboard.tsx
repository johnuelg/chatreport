import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  FileText,
  MessageSquare,
  Activity,
  Clock,
  TrendingUp,
  MessageCircle,
  Upload,
  Users,
} from "lucide-react";

const domains = [
  { name: "Emergency Department", code: "ED", color: "hsl(197, 66%, 49%)" },
  { name: "Radiology", code: "RAD", color: "hsl(200, 15%, 45%)" },
  { name: "Blood Bank", code: "BB", color: "hsl(0, 72%, 60%)" },
  { name: "Laboratory", code: "LAB", color: "hsl(200, 15%, 55%)" },
  { name: "Neonatal Intensive Care Unit", code: "NICU", color: "hsl(197, 66%, 49%)" },
  { name: "Pediatric Intensive Care Unit", code: "PICU", color: "hsl(197, 60%, 55%)" },
  { name: "Cardiopulmonary Resuscitation", code: "CPR", color: "hsl(0, 84%, 50%)" },
  { name: "Nursing", code: "Nursing", color: "hsl(280, 60%, 55%)" },
  { name: "Health Quality Index", code: "HQI", color: "hsl(160, 84%, 39%)" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Hello, {displayName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 font-medium">
            Welcome to Taif Children's Hospital Data Intelligence System
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Documents"
            value="14"
            sub="Uploaded reports & files"
            icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconColor="text-primary"
          />
          <StatCard
            label="Chat Messages"
            value="0"
            sub="AI assistant interactions"
            icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconColor="text-muted-foreground"
          />
          <StatCard
            label="ER Status"
            value="Active"
            sub={
              <span className="inline-flex items-center gap-1">
                Operational
                <TrendingUp className="w-3 h-3 text-emerald" />
                <span className="text-emerald">+12%</span>
              </span>
            }
            icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconColor="text-primary"
          />
          <StatCard
            label="Response Time"
            value="< 2s"
            sub="Average AI response"
            icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconColor="text-muted-foreground"
          />
        </div>

        {/* Quick Actions + Domains */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Quick Actions */}
          <div>
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Quick Actions</h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Common tasks for your role</p>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              <QuickAction
                icon={<MessageCircle className="w-5 h-5 text-primary" />}
                title="Ask the AI Assistant"
                description="Query ER reports and get instant answers"
                bgColor="bg-primary/10"
              />
              <QuickAction
                icon={<Upload className="w-5 h-5 text-teal" />}
                title="Upload Documents"
                description="Add new reports, data files, and documents"
                bgColor="bg-teal/10"
              />
              <QuickAction
                icon={<Users className="w-5 h-5 text-muted-foreground" />}
                title="Manage Users"
                description="Update user roles and permissions"
                bgColor="bg-secondary"
              />
            </div>
          </div>

          {/* Domains */}
          <div>
            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Domains</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">All available domains</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              {domains.map((domain, i) => (
                <div
                  key={domain.code}
                  className={`flex items-center justify-between px-3 sm:px-5 py-3 hover:bg-secondary/30 transition-colors ${
                    i < domains.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate">{domain.name}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono font-medium text-muted-foreground bg-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shrink-0 ml-2">
                    {domain.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

function StatCard({
  label,
  value,
  sub,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-border/50 bg-card p-3.5 sm:p-5 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>
        <div className={iconColor}>{icon}</div>
      </div>
      <p className="text-xl sm:text-3xl font-heading font-bold text-foreground">{value}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">{sub}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/20 hover:shadow-sm transition-all duration-300 cursor-pointer">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground font-medium truncate">{description}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
