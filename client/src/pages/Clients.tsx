import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Clients() {
  // Fetch clients from database
  const { data: clientsData = [], isLoading } = trpc.clients.list.useQuery();
  
  const clients = clientsData.map((household: any) => ({
    id: household.id,
    name: household.householdName || household.primaryContactName || "Unknown",
    email: household.email || "No email",
    portfolioValue: parseFloat(household.totalNetWorth || "0"),
    performance: 0, // Will be calculated from accounts
    nextMeeting: "No upcoming meeting",
    riskTolerance: household.riskTolerance ? 
      household.riskTolerance.charAt(0).toUpperCase() + household.riskTolerance.slice(1) : 
      "Moderate",
  }));

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your client relationships</p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Search and filters */}
        <Card className="card-shadow">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search clients..." className="pl-10 h-11" />
              </div>
              <div className="flex gap-3 md:gap-4">
                <Button variant="outline" className="flex-1 sm:flex-none h-11">Filter</Button>
                <Button variant="outline" className="flex-1 sm:flex-none h-11">Sort</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client list */}
        <div className="grid gap-3 md:gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="card-shadow hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold text-sm md:text-base">
                          {client.name.split(" ").map((n: string) => n[0]).join("")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <Link href={`/client/${client.id}`} className="text-base md:text-lg font-semibold hover:text-primary transition-colors block truncate">
                          {client.name}
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 flex-1">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Portfolio Value</p>
                        <p className="text-base md:text-lg font-semibold">{formatCurrency(client.portfolioValue)}</p>
                      </div>

                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Performance (YTD)</p>
                        <div className="flex items-center gap-1">
                          {client.performance >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <p className={`text-base md:text-lg font-semibold ${client.performance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {client.performance >= 0 ? "+" : ""}{client.performance}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Next Meeting</p>
                        <p className="text-sm font-medium">{client.nextMeeting}</p>
                      </div>

                      <div className="flex items-center">
                        <Badge variant="secondary" className="text-xs">{client.riskTolerance}</Badge>
                      </div>
                    </div>

                    <Button asChild className="w-full md:w-auto h-11">
                      <Link href={`/client/${client.id}`}>
                        View Details
                      </Link>
                    </Button>
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
