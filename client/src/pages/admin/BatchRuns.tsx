import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BatchRuns() {
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  
  // Fetch all batch runs
  const { data: batchRuns, isLoading, refetch } = trpc.insights.getAllBatchRuns.useQuery({
    limit: 50,
    offset: 0
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const runs = batchRuns || [];
  
  // Calculate stats
  const totalRuns = runs.length;
  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const successRate = totalRuns > 0 ? (completedRuns / totalRuns * 100).toFixed(1) : '0';
  const avgProcessingTime = runs.length > 0
    ? (runs.reduce((sum, r) => sum + (Number(r.avgProcessingTime) || 0), 0) / runs.length).toFixed(1)
    : '0';
  const totalHouseholds = runs.reduce((sum, r) => sum + (r.successfulHouseholds || 0), 0);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Run Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor nightly AI insight generation batch jobs
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All batch executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedRuns} of {totalRuns} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProcessingTime}s</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per batch run
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHouseholds}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Runs List */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Run History</CardTitle>
          <CardDescription>
            Detailed history of all batch job executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No batch runs yet</h3>
              <p className="text-muted-foreground">
                Batch runs will appear here once the nightly job executes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <BatchRunCard
                  key={run.id}
                  run={run}
                  expanded={expandedRun === run.id}
                  onToggle={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BatchRunCardProps {
  run: any;
  expanded: boolean;
  onToggle: () => void;
}

function BatchRunCard({ run, expanded, onToggle }: BatchRunCardProps) {
  const { data: insights, isLoading } = trpc.insights.getByBatchRun.useQuery(
    { batchRunId: run.id },
    { enabled: expanded }
  );

  const statusColor = run.status === 'completed' ? 'bg-green-500' : 
                      run.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500';
  
  const statusIcon = run.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                     run.status === 'failed' ? <XCircle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />;

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="gap-1">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              {run.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Batch Run #{run.id}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Households:</span>
              <span className="ml-2 font-medium">{run.totalHouseholds}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Successful:</span>
              <span className="ml-2 font-medium text-green-600">{run.successfulHouseholds || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Failed:</span>
              <span className="ml-2 font-medium text-red-600">{run.failedHouseholds || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="ml-2 font-medium">{Number(run.avgProcessingTime)?.toFixed(1) || '0'}s</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="ml-4"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : insights && insights.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm mb-3">Household Insights ({insights.length})</h4>
              <div className="grid gap-3">
                {insights.map((insight: any) => (
                  <div key={insight.id} className="border rounded p-3 bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Household #{insight.householdId}</span>
                      <div className="flex gap-2">
                        {insight.portfolioValidated && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Portfolio {(insight.portfolioAccuracy * 100).toFixed(0)}%
                          </Badge>
                        )}
                        {insight.newsValidated && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            News {(insight.newsAccuracy * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {insight.talkingPoints?.length || 0} talking points generated
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No insights available for this batch run</p>
          )}
        </div>
      )}
    </div>
  );
}
