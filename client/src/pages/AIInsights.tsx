import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AIInsights() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">AI Insights</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">AI Insights view coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
