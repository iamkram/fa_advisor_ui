import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { pdfExportService } from "@/services/pdfExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Mail, Plus, GripVertical, X } from "lucide-react";
import { toast } from "sonner";

interface ReportComponent {
  id: string;
  type: "holdings" | "goals" | "insights" | "risks";
  title: string;
}

export default function ReportGenerator() {
  const { user } = useAuth();
  const [reportTitle, setReportTitle] = useState("Client Meeting Report");
  const [clientName, setClientName] = useState("John Smith");
  const [components, setComponents] = useState<ReportComponent[]>([
    { id: "1", type: "holdings", title: "Holdings Summary" },
    { id: "2", type: "insights", title: "AI Insights" },
  ]);

  const availableComponents = [
    { type: "holdings" as const, title: "Holdings Summary", description: "Current portfolio positions" },
    { type: "goals" as const, title: "Client Goals", description: "Financial objectives and milestones" },
    { type: "insights" as const, title: "AI Insights", description: "AI-generated recommendations" },
    { type: "risks" as const, title: "Risks & Opportunities", description: "Portfolio analysis" },
  ];

  const addComponent = (type: ReportComponent["type"], title: string) => {
    const newComponent: ReportComponent = {
      id: Date.now().toString(),
      type,
      title,
    };
    setComponents([...components, newComponent]);
    toast.success(`Added ${title} to report`);
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    toast.success("Component removed");
  };

  const handleExportPDF = () => {
    try {
      // Prepare report data
      const reportData = {
        title: reportTitle,
        clientName: clientName,
        advisorName: user?.name || "Financial Advisor",
        date: new Date().toLocaleDateString(),
        components: components.map((component) => ({
          type: component.type,
          title: component.title,
          data: getComponentData(component.type),
        })),
      };

      // Generate and download PDF
      pdfExportService.exportReport(reportData);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const getComponentData = (type: ReportComponent["type"]) => {
    switch (type) {
      case "holdings":
        return [
          { ticker: "AAPL", name: "Apple Inc.", value: 250000, allocation: 20, change: 2.3 },
          { ticker: "MSFT", name: "Microsoft Corp.", value: 200000, allocation: 16, change: 1.8 },
          { ticker: "GOOGL", name: "Alphabet Inc.", value: 150000, allocation: 12, change: -0.5 },
        ];
      case "goals":
        return [
          "Retirement in 2035",
          "College funding for 2 children",
          "Estate planning review",
        ];
      case "insights":
        return [
          "Portfolio performance +12.3% YTD",
          "Tech sector overweight - consider rebalancing",
          "Tax-loss harvesting opportunity identified",
        ];
      case "risks":
        return [
          { severity: "medium", message: "Portfolio concentration risk in technology" },
          { severity: "low", message: "Cash allocation below recommended minimum" },
        ];
      default:
        return [];
    }
  };

  const handleEmail = () => {
    toast.success("Opening email composer...");
    // TODO: Implement email functionality
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Report Generator</h1>
            <p className="text-muted-foreground mt-1">Create custom client reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Available Components */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Available Components</CardTitle>
              <CardDescription>Drag or click to add to report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableComponents.map((component) => (
                <div
                  key={component.type}
                  className="p-3 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => addComponent(component.type, component.title)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{component.title}</p>
                      <p className="text-xs text-muted-foreground">{component.description}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right: Report Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Report Settings */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Report Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client">Client Name</Label>
                  <Input
                    id="client"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card className="card-shadow">
              <CardHeader className="bg-secondary/30">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Report Preview
                </CardTitle>
                <CardDescription>Drag to reorder components</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Report Header */}
                <div className="mb-6 pb-6 border-b border-border">
                  <h2 className="text-2xl font-bold text-primary">{reportTitle}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Components */}
                {components.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No components added yet</p>
                    <p className="text-sm">Add components from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {components.map((component, index) => (
                      <div
                        key={component.id}
                        className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                            <h3 className="font-semibold">{component.title}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeComponent(component.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Component Preview */}
                        <div className="text-sm text-muted-foreground">
                          {component.type === "holdings" && (
                            <div className="space-y-2">
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span>AAPL - Apple Inc.</span>
                                <span className="font-medium">$250,000</span>
                              </div>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span>MSFT - Microsoft Corp.</span>
                                <span className="font-medium">$200,000</span>
                              </div>
                            </div>
                          )}
                          {component.type === "goals" && (
                            <div className="space-y-2">
                              <p>• Retirement in 2035</p>
                              <p>• College funding for 2 children</p>
                              <p>• Estate planning review</p>
                            </div>
                          )}
                          {component.type === "insights" && (
                            <div className="space-y-2">
                              <p>• Portfolio performance +12.3% YTD</p>
                              <p>• Tech sector overweight - consider rebalancing</p>
                              <p>• Tax-loss harvesting opportunity identified</p>
                            </div>
                          )}
                          {component.type === "risks" && (
                            <div className="space-y-2">
                              <p className="text-orange-600">⚠️ Portfolio concentration risk in technology</p>
                              <p className="text-orange-600">⚠️ Cash allocation below recommended minimum</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {components.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div className="text-center text-sm text-muted-foreground">
                      <p>End of Report</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
