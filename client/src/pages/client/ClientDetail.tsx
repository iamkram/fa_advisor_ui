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
  
  // Fetch interactions
  const { data: interactions = [] } = trpc.interactions.getByHousehold.useQuery({ householdId });

  // Mock client data
  const client = {
    id: parseInt(id || "1"),
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    netWorth: 3500000,
    portfolioValue: 1250000,
    performance1d: 0.8,
    performanceYtd: 12.3,
    nextMeeting: "Today, 10:00 AM",
    retirementDate: "2035-06-15",
    riskTolerance: "Moderate",
  };

  const holdings = [
    { ticker: "AAPL", name: "Apple Inc.", value: 250000, allocation: 20, change: 2.3 },
    { ticker: "MSFT", name: "Microsoft Corp.", value: 200000, allocation: 16, change: 1.8 },
    { ticker: "GOOGL", name: "Alphabet Inc.", value: 150000, allocation: 12, change: -0.5 },
    { ticker: "AMZN", name: "Amazon.com Inc.", value: 125000, allocation: 10, change: 3.2 },
    { ticker: "TSLA", name: "Tesla Inc.", value: 100000, allocation: 8, change: -1.2 },
  ];

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
      <div className="p-6 space-y-6">
        {/* Back button */}
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </Link>

        {/* Client Header */}
        <Card className="card-shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">
                    {client.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-primary">{client.name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Next Meeting: {client.nextMeeting}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Link href="/report/generate">
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(client.netWorth)}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(client.portfolioValue)}</p>
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
                {holdings.map((holding) => (
                  <div key={holding.ticker} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{holding.ticker}</span>
                        <span className="text-sm text-muted-foreground">{holding.name}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${holding.allocation}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">{formatCurrency(holding.value)}</p>
                      <p className={`text-sm ${holding.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {holding.change >= 0 ? "+" : ""}{holding.change}%
                      </p>
                    </div>
                  </div>
                ))}
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
