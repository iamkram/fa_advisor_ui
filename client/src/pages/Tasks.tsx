import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function Tasks() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Tasks</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Tasks view coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
