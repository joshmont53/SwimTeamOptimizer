import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Users, Target, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  COMPETITION_TYPES, 
  ARENA_LEAGUE_CONFIG, 
  COUNTY_RELAYS_CONFIG,
  CUSTOM_COMPETITION_CONFIG,
  type CompetitionType 
} from "@shared/constants";
import type { InsertTeam } from "@shared/schema";

export default function CreateTeamPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [teamName, setTeamName] = useState("");
  const [selectedType, setSelectedType] = useState<CompetitionType | null>(null);
  const [maxIndividualEvents, setMaxIndividualEvents] = useState<number | null>(null);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<{individual: string[], relay: string[]}>({
    individual: [],
    relay: []
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { team: InsertTeam; customEvents?: {individual: string[], relay: string[]} }) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team created successfully",
        description: `${teamName} is ready for setup`,
      });
      setLocation(`/team/${data.id}/workflow`);
    },
    onError: (error) => {
      toast({
        title: "Error creating team",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCompetitionTypeSelect = (type: CompetitionType) => {
    setSelectedType(type);
    
    if (type === COMPETITION_TYPES.ARENA_LEAGUE) {
      setMaxIndividualEvents(ARENA_LEAGUE_CONFIG.maxIndividualEvents);
      setShowCustomConfig(false);
    } else if (type === COMPETITION_TYPES.COUNTY_RELAYS) {
      setMaxIndividualEvents(null); // No individual events
      setShowCustomConfig(false);
    } else if (type === COMPETITION_TYPES.CUSTOM) {
      setMaxIndividualEvents(2); // Default
      setShowCustomConfig(true);
    }
  };

  const handleCreateTeam = () => {
    if (!teamName.trim() || !selectedType) return;
    
    // For custom competitions, require at least one event to be selected
    if (selectedType === COMPETITION_TYPES.CUSTOM) {
      const totalEvents = selectedEvents.individual.length + selectedEvents.relay.length;
      if (totalEvents === 0) {
        toast({
          title: "No events selected",
          description: "Please select at least one event for your custom competition",
          variant: "destructive",
        });
        return;
      }
    }

    const team: InsertTeam = {
      name: teamName.trim(),
      competitionType: selectedType,
      maxIndividualEvents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Include custom events in the mutation if it's a custom competition
    const mutationData = selectedType === COMPETITION_TYPES.CUSTOM 
      ? { team, customEvents: selectedEvents }
      : { team };

    createTeamMutation.mutate(mutationData);
  };

  const competitionOptions = [
    {
      type: COMPETITION_TYPES.ARENA_LEAGUE,
      title: "Arena League",
      description: "Standard swimming competition with individual events only",
      features: [
        "Maximum 2 individual events per swimmer",
        "All age groups (11-16 & Open)",
        "50m & 100m all strokes + 200m IM",
        "No relay events"
      ],
      icon: <Trophy className="h-6 w-6" />,
      popular: true
    },
    {
      type: COMPETITION_TYPES.COUNTY_RELAYS,
      title: "County Relays",
      description: "Relay-only competition format",
      features: [
        "Relay events only (no individual events)",
        "4x50m Freestyle & Medley (12, 14, 16 & under)",
        "4x100m Freestyle & Medley (Open)",
        "4x200m Freestyle (Open)"
      ],
      icon: <Users className="h-6 w-6" />,
      popular: false
    },
    {
      type: COMPETITION_TYPES.CUSTOM,
      title: "Custom Competition",
      description: "Configure your own event list and rules",
      features: [
        "Select individual and relay events",
        "Filter by stroke, distance, age, gender",
        "Set custom individual event limits",
        "Full flexibility for any meet format"
      ],
      icon: <Target className="h-6 w-6" />,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up a new swimming team for your competition
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Team Name */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Team Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="teamName">Enter a name for your team</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., County Championship 2025"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Competition Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Competition Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose the type of competition to configure the available events and rules
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {competitionOptions.map((option) => (
                  <Card
                    key={option.type}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedType === option.type
                        ? "ring-2 ring-blue-600 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => handleCompetitionTypeSelect(option.type)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <CardTitle className="text-lg">{option.title}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          {option.popular && (
                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                          )}
                          {selectedType === option.type && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                      <ul className="space-y-1">
                        {option.features.map((feature, index) => (
                          <li key={index} className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Custom Competition Configuration */}
              {showCustomConfig && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Max Individual Events */}
                      <div className="space-y-2">
                        <Label htmlFor="maxEvents">Maximum individual events per swimmer</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="maxEvents"
                            type="number"
                            min="0"
                            max="10"
                            value={maxIndividualEvents || ""}
                            onChange={(e) => setMaxIndividualEvents(
                              e.target.value ? parseInt(e.target.value) : null
                            )}
                            className="max-w-24"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMaxIndividualEvents(0)}
                          >
                            No Individual Events
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                          {maxIndividualEvents === 0
                            ? "No individual events (relay-only competition)"
                            : maxIndividualEvents 
                            ? `Each swimmer can compete in up to ${maxIndividualEvents} individual events`
                            : "Swimmers can compete in unlimited individual events"
                          }
                        </p>
                      </div>

                      {/* Event Selection */}
                      <div className="space-y-4">
                        <Label>Select Events for This Competition</Label>
                        <Tabs defaultValue="individual" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="individual">Individual Events</TabsTrigger>
                            <TabsTrigger value="relay">Relay Events</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="individual" className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Select individual events to include in this competition. Events are organized by stroke and distance.
                              </p>
                              
                              {/* Individual Events Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {CUSTOM_COMPETITION_CONFIG.individualEvents.map((event: any) => (
                                  <div key={event.key} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={event.key}
                                        checked={selectedEvents.individual.includes(event.key)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedEvents(prev => ({
                                              ...prev,
                                              individual: [...prev.individual, event.key]
                                            }));
                                          } else {
                                            setSelectedEvents(prev => ({
                                              ...prev,
                                              individual: prev.individual.filter(k => k !== event.key)
                                            }));
                                          }
                                        }}
                                      />
                                      <Label 
                                        htmlFor={event.key}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {event.event}
                                      </Label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                      Ages {event.ageCategories.join(", ")} • {event.genders.join(" & ")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="relay" className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Select relay events to include in this competition. Each relay requires 4 swimmers.
                              </p>
                              
                              {/* Relay Events Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {CUSTOM_COMPETITION_CONFIG.relayEvents.map((relay: any) => (
                                  <div key={relay.key} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={relay.key}
                                        checked={selectedEvents.relay.includes(relay.key)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedEvents(prev => ({
                                              ...prev,
                                              relay: [...prev.relay, relay.key]
                                            }));
                                          } else {
                                            setSelectedEvents(prev => ({
                                              ...prev,
                                              relay: prev.relay.filter(k => k !== relay.key)
                                            }));
                                          }
                                        }}
                                      />
                                      <Label 
                                        htmlFor={relay.key}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {relay.relayName}
                                      </Label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                      Ages {relay.ageCategories.join(", ")} • {relay.genders.join(" & ")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        <div className="text-sm text-gray-500">
                          Selected: {selectedEvents.individual.length} individual events, {selectedEvents.relay.length} relay events
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Create Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleCreateTeam}
              disabled={!teamName.trim() || !selectedType || createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}