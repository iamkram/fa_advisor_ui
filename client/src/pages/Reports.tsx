import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Reports view coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
