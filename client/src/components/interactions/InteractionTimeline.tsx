import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Calendar, FileText, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Interaction {
  id: number;
  interactionType: "email" | "call" | "meeting" | "note" | "task";
  subject: string | null;
  description: string | null;
  interactionDate: Date;
  duration?: number | null;
  outcome?: string | null;
  nextSteps?: string | null;
}

interface InteractionTimelineProps {
  householdId: number;
  interactions: Interaction[];
}

const getInteractionIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail className="h-5 w-5" />;
    case "call":
      return <Phone className="h-5 w-5" />;
    case "meeting":
      return <Calendar className="h-5 w-5" />;
    case "note":
      return <FileText className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getInteractionColor = (type: string) => {
  switch (type) {
    case "email":
      return "bg-blue-500";
    case "call":
      return "bg-green-500";
    case "meeting":
      return "bg-purple-500";
    case "note":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

export default function InteractionTimeline({ householdId, interactions }: InteractionTimelineProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredInteractions = filterType === "all" 
    ? interactions 
    : interactions.filter(i => i.interactionType === filterType);

  const sortedInteractions = [...filteredInteractions].sort(
    (a, b) => new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Timeline</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("email")}
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            <Button
              variant={filterType === "call" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("call")}
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
            <Button
              variant={filterType === "meeting" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("meeting")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Meeting
            </Button>
            <Button
              variant={filterType === "note" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("note")}
            >
              <FileText className="h-4 w-4 mr-1" />
              Note
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedInteractions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No interactions found
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Timeline items */}
            <div className="space-y-6">
              {sortedInteractions.map((interaction, index) => (
                <div key={interaction.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${getInteractionColor(interaction.interactionType)} text-white`}>
                    {getInteractionIcon(interaction.interactionType)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{interaction.subject}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(interaction.interactionDate), "MMM d, yyyy 'at' h:mm a")}
                              {interaction.duration && (
                                <Badge variant="secondary">
                                  {interaction.duration} min
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {interaction.interactionType}
                          </Badge>
                        </div>
                        
                        {interaction.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {interaction.description}
                          </p>
                        )}
                        
                        {interaction.outcome && (
                          <div className="flex items-start gap-2 text-sm bg-muted p-3 rounded-md">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <span className="font-medium">Outcome:</span> {interaction.outcome}
                            </div>
                          </div>
                        )}
                        
                        {interaction.nextSteps && (
                          <div className="mt-2 text-sm bg-blue-50 p-3 rounded-md">
                            <span className="font-medium">Next Steps:</span> {interaction.nextSteps}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
