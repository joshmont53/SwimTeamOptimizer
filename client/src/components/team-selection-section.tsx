import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trophy, Users, Target, CheckCircle, Calendar, Settings, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Team, InsertTeam } from "@shared/schema";
import { 
  COMPETITION_TYPES, 
  ARENA_LEAGUE_CONFIG, 
  COUNTY_RELAYS_CONFIG,
  getCompetitionTypeDisplay,
  type CompetitionType 
} from "@shared/constants";

interface TeamSelectionSectionProps {
  onTeamSelected: (team: Team) => void;
}

export default function TeamSelectionSection({ onTeamSelected }: TeamSelectionSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedType, setSelectedType] = useState<CompetitionType | null>(null);
  const [maxIndividualEvents, setMaxIndividualEvents] = useState<number | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

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
      setShowCreateDialog(false);
      resetForm();
      onTeamSelected(data);
    },
    onError: () => {
      toast({
        title: "Error creating team",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team deleted successfully",
        description: "The team and all its data have been removed",
      });
      setTeamToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error deleting team",
        description: "Please try again",
        variant: "destructive",
      });
      setTeamToDelete(null);
    },
  });

  const resetForm = () => {
    setTeamName("");
    setSelectedType(null);
    setMaxIndividualEvents(null);
  };

  const handleCompetitionTypeSelect = (type: CompetitionType) => {
    setSelectedType(type);
    
    if (type === COMPETITION_TYPES.ARENA_LEAGUE) {
      setMaxIndividualEvents(ARENA_LEAGUE_CONFIG.maxIndividualEvents);
    } else if (type === COMPETITION_TYPES.COUNTY_RELAYS) {
      setMaxIndividualEvents(null);
    } else if (type === COMPETITION_TYPES.CUSTOM) {
      setMaxIndividualEvents(2);
    }
  };

  const handleCreateTeam = () => {
    if (!teamName.trim() || !selectedType) return;

    const team = {
      name: teamName.trim(),
      competitionType: selectedType as string,
      maxIndividualEvents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "in_progress" as const,
      currentStep: 1
    };

    createTeamMutation.mutate(team);
  };

  const competitionOptions = [
    {
      type: COMPETITION_TYPES.ARENA_LEAGUE,
      title: "Arena League",
      description: "Standard swimming competition with individual events only",
      features: ["Max 2 individual events per swimmer", "All age groups", "50m & 100m all strokes + 200m IM"],
      icon: <Trophy className="h-5 w-5" />,
      popular: true
    },
    {
      type: COMPETITION_TYPES.COUNTY_RELAYS,
      title: "County Relays",
      description: "Relay-only competition format",
      features: ["Relay events only", "4x50m & 4x100m events", "Age group specific"],
      icon: <Users className="h-5 w-5" />,
      popular: false
    },
    {
      type: COMPETITION_TYPES.CUSTOM,
      title: "Custom Competition",
      description: "Configure your own event list and rules",
      features: ["Select individual/relay events", "Custom event limits", "Full flexibility"],
      icon: <Target className="h-5 w-5" />,
      popular: false
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select or Create Team</h1>
        <p className="text-gray-600">
          Choose an existing team to continue working on, or create a new team for your competition
        </p>
      </div>

      {/* Create New Team Button */}
      <div className="text-center">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="mb-6">
              <Plus className="mr-2 h-5 w-5" />
              Create New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., County Championship 2025"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              {/* Competition Type */}
              <div className="space-y-4">
                <Label>Competition Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {competitionOptions.map((option) => (
                    <Card
                      key={option.type}
                      className={`cursor-pointer transition-all ${
                        selectedType === option.type
                          ? "ring-2 ring-blue-600 shadow-md"
                          : "hover:shadow-sm"
                      }`}
                      onClick={() => handleCompetitionTypeSelect(option.type)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <CardTitle className="text-sm">{option.title}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            {option.popular && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                            {selectedType === option.type && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xs text-gray-600">{option.description}</p>
                        <ul className="space-y-1">
                          {option.features.map((feature, index) => (
                            <li key={index} className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Configuration */}
              {selectedType === COMPETITION_TYPES.CUSTOM && (
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
                      className="w-24"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMaxIndividualEvents(null)}
                    >
                      No Limit
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim() || !selectedType || createTeamMutation.isPending}
                  type="button"
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Teams */}
      {teams.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                    <Badge variant={team.status === "selected" ? "default" : "secondary"}>
                      {team.status === "selected" ? "Selected" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="mr-2 h-4 w-4" />
                      {getCompetitionTypeDisplay(team.competitionType as any)}
                    </div>
                    
                    {team.maxIndividualEvents && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="mr-2 h-4 w-4" />
                        Max {team.maxIndividualEvents} events per swimmer
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(team.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {team.status === "selected" ? (
                      <Link href={`/team/${team.id}/workflow`} className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onTeamSelected(team)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Continue Setup
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{team.name}"? This action cannot be undone. 
                            All swimmers, times, and event assignments will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTeamMutation.mutate(team.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteTeamMutation.isPending}
                          >
                            {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600">Create your first team to get started</p>
        </div>
      )}
    </div>
  );
}