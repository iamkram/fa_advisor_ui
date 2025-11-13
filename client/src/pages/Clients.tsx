import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";

export default function Clients() {
  // Mock client data
  const clients = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      portfolioValue: 1250000,
      performance: 12.3,
      nextMeeting: "Today, 10:00 AM",
      riskTolerance: "Moderate",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      portfolioValue: 850000,
      performance: 8.7,
      nextMeeting: "Today, 2:00 PM",
      riskTolerance: "Conservative",
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "m.chen@email.com",
      portfolioValue: 2100000,
      performance: -2.1,
      nextMeeting: "Tomorrow, 11:00 AM",
      riskTolerance: "Aggressive",
    },
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client relationships</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Search and filters */}
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search clients..." className="pl-10" />
              </div>
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Sort</Button>
            </div>
          </CardContent>
        </Card>

        {/* Client list */}
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="card-shadow hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {client.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <Link href={`/client/${client.id}`}>
                          <a className="text-lg font-semibold hover:text-primary transition-colors">
                            {client.name}
                          </a>
                        </Link>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-lg font-semibold">{formatCurrency(client.portfolioValue)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Performance (YTD)</p>
                      <div className="flex items-center justify-end gap-1">
                        {client.performance >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${client.performance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {client.performance >= 0 ? "+" : ""}{client.performance}%
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Next Meeting</p>
                      <p className="text-sm font-medium">{client.nextMeeting}</p>
                    </div>

                    <div>
                      <Badge variant="secondary">{client.riskTolerance}</Badge>
                    </div>

                    <Link href={`/client/${client.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
