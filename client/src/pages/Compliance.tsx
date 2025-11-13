import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, AlertCircle, Info, Search, TrendingDown, Shield, Calendar, PieChart as PieChartIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type AlertSeverity = "critical" | "warning" | "info";
type AlertType = "concentration_risk" | "suitability_mismatch" | "annual_review_due" | "large_position" | "underperforming";

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    badgeVariant: "destructive" as const,
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    badgeVariant: "default" as const,
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeVariant: "secondary" as const,
  },
};

const typeConfig = {
  concentration_risk: {
    icon: PieChartIcon,
    label: "Concentration Risk",
    color: "text-red-500",
  },
  suitability_mismatch: {
    icon: Shield,
    label: "Suitability Mismatch",
    color: "text-orange-500",
  },
  annual_review_due: {
    icon: Calendar,
    label: "Annual Review Due",
    color: "text-purple-500",
  },
  large_position: {
    icon: TrendingDown,
    label: "Large Position",
    color: "text-blue-500",
  },
  underperforming: {
    icon: TrendingDown,
    label: "Underperforming",
    color: "text-gray-500",
  },
};

export default function Compliance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");

  const { data: alerts, isLoading } = trpc.compliance.scanAlerts.useQuery();
  const { data: stats } = trpc.compliance.getStats.useQuery();
  const triggerScan = trpc.compliance.triggerScan.useMutation();

  // Filter alerts
  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = searchTerm === "" || 
      alert.householdName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesType = typeFilter === "all" || alert.type === typeFilter;

    return matchesSearch && matchesSeverity && matchesType;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Compliance Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Automated risk monitoring and compliance tracking
            </p>
          </div>
          <Button
            onClick={() => triggerScan.mutate()}
            disabled={triggerScan.isPending}
            variant="outline"
          >
            {triggerScan.isPending ? "Scanning..." : "Run Scan Now"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.householdsAffected || 0} households affected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats?.criticalAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Immediate action required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.warningAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Info</CardTitle>
              <Info className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats?.infoAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">For review</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts by Type</CardTitle>
            <CardDescription>Distribution of compliance issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(typeConfig).map(([type, config]) => {
                const Icon = config.icon;
                const count = stats?.alertsByType[type as AlertType] || 0;
                return (
                  <div key={type} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by household or alert..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AlertSeverity | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AlertType | "all")}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="concentration_risk">Concentration Risk</SelectItem>
                  <SelectItem value="suitability_mismatch">Suitability Mismatch</SelectItem>
                  <SelectItem value="annual_review_due">Annual Review Due</SelectItem>
                  <SelectItem value="large_position">Large Position</SelectItem>
                  <SelectItem value="underperforming">Underperforming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts ({filteredAlerts.length})</CardTitle>
            <CardDescription>
              {filteredAlerts.length === 0 ? "No alerts match your filters" : "Review and take action on compliance issues"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {alerts?.length === 0 ? "No compliance alerts found. All portfolios are compliant! 🎉" : "No alerts match your current filters."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const severityInfo = severityConfig[alert.severity];
                  const typeInfo = typeConfig[alert.type];
                  const SeverityIcon = severityInfo.icon;
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 border-l-4 ${severityInfo.borderColor} ${severityInfo.bgColor} rounded-lg`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <SeverityIcon className={`h-5 w-5 ${severityInfo.color} mt-0.5`} />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <Badge variant={severityInfo.badgeVariant}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <TypeIcon className="h-3 w-3" />
                                {typeInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{alert.householdName}</span> • {alert.advisorName}
                            </p>
                            <p className="text-sm">{alert.description}</p>
                            
                            {alert.affectedHoldings && alert.affectedHoldings.length > 0 && (
                              <div className="mt-2 p-2 bg-background rounded border">
                                <p className="text-xs font-medium mb-1">Affected Holdings:</p>
                                {alert.affectedHoldings.map((holding, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground">
                                    {holding.ticker}: ${holding.value.toLocaleString()} ({holding.percentage.toFixed(1)}%)
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 p-3 bg-background rounded border-l-2 border-primary">
                              <p className="text-xs font-medium text-primary mb-1">Recommendation:</p>
                              <p className="text-sm">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
