import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Target, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  COMPETITION_TYPES, 
  ARENA_LEAGUE_CONFIG, 
  COUNTY_RELAYS_CONFIG,
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

  const createTeamMutation = useMutation({
    mutationFn: async (team: InsertTeam) => {
      const response = await apiRequest("POST", "/api/teams", team);
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

    const team: InsertTeam = {
      name: teamName.trim(),
      competitionType: selectedType,
      maxIndividualEvents,
      isComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createTeamMutation.mutate(team);
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxEvents">Maximum individual events per swimmer</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="maxEvents"
                            type="number"
                            min="1"
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
                            onClick={() => setMaxIndividualEvents(null)}
                          >
                            No Limit
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                          {maxIndividualEvents 
                            ? `Each swimmer can compete in up to ${maxIndividualEvents} individual events`
                            : "Swimmers can compete in unlimited individual events"
                          }
                        </p>
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