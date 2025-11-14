import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback } from "react";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch clients from database
  const { data: clientsData = [], isLoading } = trpc.clients.list.useQuery();
  
  // Helper function to format currency
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  }, []);
  
  // Transform and filter clients
  const allClients = clientsData.map((household: any) => ({
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

  // Filter clients based on search query
  const clients = useMemo(() => {
    if (!searchQuery.trim()) return allClients;
    
    const query = searchQuery.toLowerCase();
    return allClients.filter(client => {
      // Search by name
      if (client.name.toLowerCase().includes(query)) return true;
      
      // Search by email
      if (client.email.toLowerCase().includes(query)) return true;
      
      // Search by portfolio value (e.g., "1000000" or "1M")
      const portfolioStr = client.portfolioValue.toString();
      if (portfolioStr.includes(query)) return true;
      
      // Search by formatted currency (e.g., "$1,250,000")
      const formattedValue = formatCurrency(client.portfolioValue).toLowerCase();
      if (formattedValue.includes(query)) return true;
      
      return false;
    });
  }, [allClients, searchQuery, formatCurrency]);

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
                <Input 
                  placeholder="Search by name, email, or portfolio value..." 
                  className="pl-10 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3 md:gap-4">
                <Button variant="outline" className="flex-1 sm:flex-none h-11">Filter</Button>
                <Button variant="outline" className="flex-1 sm:flex-none h-11">Sort</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : clients.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No clients match "${searchQuery}". Try a different search term.`
                  : "Add your first client to get started."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  );
}
