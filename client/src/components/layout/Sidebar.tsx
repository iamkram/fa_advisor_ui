import { Home, Users, TrendingUp, FileText, CheckSquare, FolderOpen, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: TrendingUp, label: "Holdings", path: "/holdings" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: FolderOpen, label: "Documents", path: "/documents" },
  { icon: Sparkles, label: "AI Insights", path: "/ai-insights" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">FA</span>
          </div>
          <span className="font-semibold text-lg">Advisor AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          © 2025 Advisor AI
        </div>
      </div>
    </aside>
  );
}
