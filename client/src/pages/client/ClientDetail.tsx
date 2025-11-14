import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { AIDrawer } from "@/components/ai/AIDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InteractionTimeline from "@/components/interactions/InteractionTimeline";
import MeetingRecorder from "@/components/meetings/MeetingRecorder";
import { trpc } from "@/lib/trpc";

export default function ClientDetail() {
  const { id } = useParams();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const householdId = parseInt(id || "1");
  
  // Fetch household data from database
  const { data: household, isLoading: householdLoading } = trpc.clients.getById.useQuery({ id: householdId });
  const { data: interactions = [] } = trpc.interactions.getByHousehold.useQuery({ householdId });
  const { data: holdings = [] } = trpc.holdings.getByClient.useQuery({ clientId: householdId });
  const { data: meetings = [] } = trpc.meetings.getByClient.useQuery({ clientId: householdId });

  // Transform database data to match component expectations
  const client = household ? {
    id: household.id,
    name: household.householdName || household.primaryContactName || "Unknown Client",
    email: household.email || "No email",
    phone: household.phone || "No phone",
    netWorth: parseFloat(household.totalNetWorth || "0"),
    portfolioValue: parseFloat(household.totalNetWorth || "0") * 0.6, // Estimate
    performance1d: 0.5, // Mock for now
    performanceYtd: 8.5, // Mock for now
    nextMeeting: meetings[0] ? new Date(meetings[0].meetingDate).toLocaleString() : "No upcoming meeting",
    retirementDate: "2035-06-15", // Mock for now
    riskTolerance: household.riskTolerance ? 
      household.riskTolerance.charAt(0).toUpperCase() + household.riskTolerance.slice(1) : 
      "Moderate",
  } : null;

  if (householdLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Client not found</h2>
            <Button asChild className="mt-4">
              <Link href="/clients">Back to Clients</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Holdings are already fetched from database above

  const transactions = [
    { date: "2025-11-10", type: "Buy", ticker: "AAPL", shares: 50, amount: 8750 },
    { date: "2025-11-05", type: "Sell", ticker: "TSLA", shares: 25, amount: 6250 },
    { date: "2025-10-28", type: "Dividend", ticker: "MSFT", amount: 450 },
  ];

  const talkingPoints = [
    "Portfolio performance +12.3% YTD, outperforming benchmark by 3.1%",
    "Tech sector allocation at 56% - consider rebalancing to target 50%",
    "Tax-loss harvesting opportunity with TSLA position (-15% unrealized loss)",
    "Q4 RMD requirement: $45,000 due by December 31st",
  ];

  const riskFlags = [
    { severity: "medium", message: "Portfolio overweight in technology sector" },
    { severity: "low", message: "Cash allocation below recommended 5% minimum" },
  ];

  const recommendedQuestions = [
    "Have there been any changes to your retirement timeline?",
    "Are you interested in tax-loss harvesting this quarter?",
    "Would you like to review your estate planning documents?",
    "Have you considered increasing your 529 contributions?",
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="h-11">
          <Link href="/clients">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Link>
        </Button>

        {/* Client Header */}
        <Card className="card-shadow-md">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-lg md:text-xl">
                    {client.name.split(" ").map((n: string) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-primary truncate">{client.name}</h1>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Next: {client.nextMeeting}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto h-11">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button asChild className="w-full sm:w-auto h-11">
                  <Link href="/report/generate">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
              <div className="p-3 md:p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Net Worth</p>
                <p className="text-lg md:text-2xl font-bold mt-1">{formatCurrency(client.netWorth)}</p>
              </div>
              <div className="p-3 md:p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-lg md:text-2xl font-bold mt-1">{formatCurrency(client.portfolioValue)}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">1-Day Performance</p>
                <div className="flex items-center gap-1 mt-1">
                  {client.performance1d >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-2xl font-bold ${client.performance1d >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {client.performance1d >= 0 ? "+" : ""}{client.performance1d}%
                  </p>
                </div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">YTD Performance</p>
                <div className="flex items-center gap-1 mt-1">
                  {client.performanceYtd >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-2xl font-bold ${client.performanceYtd >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {client.performanceYtd >= 0 ? "+" : ""}{client.performanceYtd}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Overview */}
          <div className="space-y-6">
            {/* Top Holdings */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Top Holdings</CardTitle>
                <CardDescription>Largest positions by value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {holdings.map((holding: any) => {
                  const currentValue = parseFloat(holding.currentValue || "0");
                  const costBasis = parseFloat(holding.costBasis || "0");
                  const change = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
                  const allocation = client.portfolioValue > 0 ? (currentValue / client.portfolioValue) * 100 : 0;
                  
                  return (
                    <div key={holding.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{holding.ticker}</span>
                          <span className="text-sm text-muted-foreground">{holding.companyName || holding.ticker}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min(allocation, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">{formatCurrency(currentValue)}</p>
                        <p className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">{tx.type} {tx.ticker}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        {tx.shares && <p className="text-sm text-muted-foreground">{tx.shares} shares</p>}
                        <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Meeting Preparation */}
          <div className="space-y-6">
            {/* Talking Points Generator */}
            <Card className="card-shadow border-primary/20">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI-Generated Talking Points
                    </CardTitle>
                    <CardDescription>Key discussion topics for your meeting</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAiDrawerOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {talkingPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{point}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Portfolio Risk Flags */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Portfolio Risk Flags
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskFlags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${flag.severity === "high" ? "text-red-600" : "text-orange-600"}`} />
                    <div>
                      <Badge variant={flag.severity === "high" ? "destructive" : "secondary"} className="mb-1">
                        {flag.severity}
                      </Badge>
                      <p className="text-sm">{flag.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Questions */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Recommended Questions</CardTitle>
                <CardDescription>Topics to discuss in your meeting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendedQuestions.map((question, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 hover:bg-accent rounded-lg transition-colors">
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{question}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Meeting Recorder Section */}
        <div className="mt-8">
          <MeetingRecorder 
            householdId={householdId} 
            clientName={client.name}
            onNotesGenerated={(notes) => {
              console.log('Notes generated:', notes);
              // Optionally refresh interactions to show the new meeting
            }}
          />
        </div>
        
        {/* Activity Timeline Section */}
        <div className="mt-8">
          <InteractionTimeline householdId={householdId} interactions={interactions} />
        </div>
      </div>

      {/* AI Drawer */}
      <AIDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        clientName={client.name}
      />
    </DashboardLayout>
  );
}
