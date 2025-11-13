import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Advisor AI</CardTitle>
            <CardDescription>
              Your intelligent meeting preparation assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for demonstration
  const upcomingMeetings = [
    {
      id: 1,
      clientName: "John Smith",
      time: "10:00 AM",
      type: "Quarterly Review",
      talkingPoints: ["Portfolio performance +12.3% YTD", "Tax-loss harvesting opportunity", "Rebalancing recommendation"],
    },
    {
      id: 2,
      clientName: "Sarah Johnson",
      time: "2:00 PM",
      type: "Planning Session",
      talkingPoints: ["Retirement timeline update", "529 plan contribution", "Estate planning review"],
    },
  ];

  const tasks = [
    { id: 1, title: "Review tax-loss harvesting for Q4", priority: "high", completed: false },
    { id: 2, title: "Prepare annual review reports", priority: "medium", completed: false },
    { id: 3, title: "Follow up on client referrals", priority: "low", completed: true },
  ];

  const insights = [
    { icon: TrendingUp, title: "Market Update", description: "S&P 500 up 1.2% this week", color: "text-green-600" },
    { icon: AlertTriangle, title: "Risk Alert", description: "3 clients overweight tech sector", color: "text-orange-600" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-3xl font-bold">Good morning, {user?.name?.split(" ")[0] || "Advisor"}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening today</p>
        </div>

        {/* Meeting Prep Summary Card */}
        <Card className="card-shadow-md border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Meetings
                </CardTitle>
                <CardDescription>Preparation summary and key talking points</CardDescription>
              </div>
              <Badge variant="secondary">{upcomingMeetings.length} scheduled</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{meeting.clientName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{meeting.time}</span>
                      <span>•</span>
                      <span>{meeting.type}</span>
                    </div>
                  </div>
                  <Button size="sm">View Details</Button>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Top 3 Talking Points:</p>
                  <ul className="space-y-1">
                    {meeting.talkingPoints.map((point, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights & News Panel */}
          <Card className="card-shadow">
            <CardHeader className="bg-secondary/50">
              <CardTitle>Insights & News</CardTitle>
              <CardDescription>Market updates and client-specific alerts</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {insights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full">View All Insights</Button>
            </CardContent>
          </Card>

          {/* Task & To-Do Card */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Tasks & To-Dos</CardTitle>
              <CardDescription>Auto-generated from AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                    readOnly
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                  </div>
                  <Badge
                    variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">View All Tasks</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
