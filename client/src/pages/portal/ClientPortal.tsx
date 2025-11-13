import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Calendar, FileText, DollarSign, PieChart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"];

export default function ClientPortal() {
  const { user } = useAuth();
  
  // In production, client would be identified by their own auth
  // For now, we'll use the first household of the logged-in user
  const { data: households } = trpc.clients.list.useQuery() as any;
  const household = households?.[0];

  const { data: holdings } = trpc.holdings.getByClient.useQuery(
    { clientId: household?.id || 0 },
    { enabled: !!household }
  );

  if (!household) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Your Client Portal</CardTitle>
            <CardDescription>
              Please log in with your client credentials to view your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Client Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate portfolio metrics
  const totalValue = holdings?.reduce((sum, h) => sum + Number(h.currentValue || 0), 0) || 0;
  const totalGainLoss = holdings?.reduce((sum, h) => {
    const cost = Number(h.shares) * Number(h.costBasis || 0);
    const current = Number(h.currentValue || 0);
    return sum + (current - cost);
  }, 0) || 0;
  const totalReturn = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  // Asset allocation
  const assetAllocation = holdings?.reduce((acc, h) => {
    const assetClass = h.assetClass || "other";
    const value = Number(h.currentValue || 0);
    const existing = acc.find(a => a.name === assetClass);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: assetClass.replace("_", " ").toUpperCase(), value });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>) || [];

  // Upcoming meetings (mock data for demo)
  const upcomingMeetings = [] as any[];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">FA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Client Portal</h1>
              <p className="text-sm text-muted-foreground">{household.householdName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">As of today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalReturn >= 0 ? "+" : ""}{totalReturn.toFixed(2)}% return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Holdings Count</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{holdings?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total positions</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="holdings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>Current positions in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {holdings?.map((holding) => {
                    const cost = Number(holding.shares) * Number(holding.costBasis || 0);
                    const current = Number(holding.currentValue || 0);
                    const gainLoss = current - cost;
                    const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

                    return (
                      <div key={holding.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{holding.ticker}</p>
                            <Badge variant="outline" className="text-xs">
                              {holding.assetClass?.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {holding.shares} shares @ ${Number(holding.costBasis || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className={`text-sm ${gainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {gainLoss >= 0 ? "+" : ""}${gainLoss.toFixed(2)} ({gainLossPercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                  <CardDescription>Portfolio distribution by asset class</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Your portfolio returns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Year to Date</p>
                    <p className="text-2xl font-bold text-green-500">+{totalReturn.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                    <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Holdings</p>
                    <p className="text-2xl font-bold">{holdings?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Your statements and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Q4 2024 Statement", date: "2024-12-31", type: "Statement" },
                    { name: "Annual Tax Report 2024", date: "2024-12-31", type: "Tax Document" },
                    { name: "Q3 2024 Statement", date: "2024-09-30", type: "Statement" },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.type} • {doc.date}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Scheduled meetings with your advisor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingMeetings.length > 0 ? (
                    upcomingMeetings.map((meeting: any) => (
                      <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(meeting.scheduledAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge>{meeting.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No upcoming meetings scheduled
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
