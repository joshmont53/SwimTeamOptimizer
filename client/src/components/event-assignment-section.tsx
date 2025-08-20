import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Swimmer, Team } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { getCompetitionTypeDisplay } from "@shared/constants";

interface EventAssignmentSectionProps {
  swimmers: Swimmer[];
  isActive: boolean;
  onOptimizationComplete: (results: any) => void;
  onBackToSquadSelection: () => void;
  selectedTeam?: Team;
}

interface Events {
  individual: Array<{
    event: string;
    ageCategory: number;
    gender: string;
  }>;
  relay: Array<{
    event: string;
    ageCategory: number;
    gender: string;
  }>;
}

export default function EventAssignmentSection({ 
  swimmers, 
  isActive, 
  onOptimizationComplete,
  onBackToSquadSelection,
  selectedTeam
}: EventAssignmentSectionProps) {
  const [eventAssignments, setEventAssignments] = useState<Record<string, number | null>>({});
  const [relayAssignments, setRelayAssignments] = useState<Record<string, number | null>>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery<Events>({
    queryKey: [`/api/teams/${selectedTeam?.id}/events`],
    enabled: isActive && !!selectedTeam?.id,
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeam?.id) {
        throw new Error('No team selected');
      }
      
      console.log('Frontend: Starting optimisation request for team', selectedTeam.id);
      const response = await fetch(`/api/optimize/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Optimisation failed');
      }
      
      return response.json();
    },
    onSuccess: (results) => {
      setIsOptimizing(false);
      onOptimizationComplete(results);
      toast({
        title: "Optimisation complete",
        description: "Team selection has been optimised successfully",
      });
    },
    onError: (error: any) => {
      setIsOptimizing(false);
      toast({
        title: "Optimisation failed",
        description: error.message || "Failed to run optimisation",
        variant: "destructive",
      });
    }
  });

  const availableSwimmers = swimmers.filter(s => s.isAvailable);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    
    console.log("Event assignments to save:", eventAssignments);
    
    // Save event assignments first
    const assignmentPromises = [];
    
    for (const [eventKey, swimmerId] of Object.entries(eventAssignments)) {
      if (swimmerId) {
        console.log(`Processing assignment: ${eventKey} -> ${swimmerId}`);
        const [event, ageCategory, gender] = eventKey.split('_');
        // Find the swimmer to get their ASA number
        console.log(`Looking for swimmer ID: ${swimmerId}`);
        console.log(`Available swimmer IDs:`, availableSwimmers.slice(0, 5).map(s => `${s.id}(${s.firstName} ${s.lastName})`));
        
        const swimmer = availableSwimmers.find(s => s.id === parseInt(swimmerId.toString()));
        if (swimmer) {
          console.log(`Found swimmer: ${swimmer.firstName} ${swimmer.lastName} (ASA: ${swimmer.asaNo})`);
          assignmentPromises.push(
            fetch(`/api/event-assignments/${selectedTeam?.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event,
                ageCategory: parseInt(ageCategory),
                gender,
                swimmerId: swimmer.asaNo, // Use ASA number instead of database ID
                isPreAssigned: true
              })
            })
          );
        } else {
          console.log(`ERROR: Could not find swimmer with ID ${swimmerId}`);
          console.log(`Total swimmers available: ${swimmers.length}`);
        }
      }
    }
    
    // Save relay assignments
    for (const [relayKey, swimmerId] of Object.entries(relayAssignments)) {
      if (swimmerId) {
        console.log(`Processing relay assignment: ${relayKey} -> ${swimmerId}`);
        
        // Parse relay key: complex format like "4 x 100m Freestyle_99_Male_1_Backstroke"
        const keyParts = relayKey.split('_');
        
        // Extract components by working backwards from the end
        let position, stroke, gender, ageCategory, relayName;
        
        if (keyParts.length >= 4) {
          // Check if last part is a stroke (for medley relays)
          const lastPart = keyParts[keyParts.length - 1];
          
          if (['Backstroke', 'Breaststroke', 'Butterfly', 'Freestyle'].includes(lastPart)) {
            // Format: "RelayName_Age_Gender_Position_Stroke"
            stroke = lastPart;
            position = parseInt(keyParts[keyParts.length - 2]);
            gender = keyParts[keyParts.length - 3];
            ageCategory = parseInt(keyParts[keyParts.length - 4]);
            relayName = keyParts.slice(0, -4).join('_');
          } else {
            // Format: "RelayName_Age_Gender_Position"
            position = parseInt(lastPart);
            gender = keyParts[keyParts.length - 2];
            ageCategory = parseInt(keyParts[keyParts.length - 3]);
            relayName = keyParts.slice(0, -3).join('_');
          }
        }
        
        console.log(`Parsed relay assignment:`, { relayKey, relayName, ageCategory, gender, position, stroke });
        
        // Find the swimmer to get their ASA number
        const swimmer = availableSwimmers.find(s => s.id === parseInt(swimmerId.toString()));
        if (swimmer) {
          console.log(`Found relay swimmer: ${swimmer.firstName} ${swimmer.lastName} (ASA: ${swimmer.asaNo})`);
          assignmentPromises.push(
            fetch(`/api/relay-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                teamId: selectedTeam?.id,
                relayName,
                ageCategory,
                gender,
                position,
                stroke,
                swimmerId: swimmer.asaNo, // Use ASA number for consistency with individual assignments
                isPreAssigned: true
              })
            })
          );
        } else {
          console.log(`ERROR: Could not find relay swimmer with ID ${swimmerId}`);
        }
      }
    }
    
    console.log(`Saving ${assignmentPromises.length} total pre-assignments (individual + relay)...`);
    
    try {
      const responses = await Promise.all(assignmentPromises);
      console.log(`Successfully saved ${responses.length} pre-assignments`);
      
      // Check for any failed responses
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Assignment ${i} failed:`, response.status, errorText);
          throw new Error(`Assignment failed: ${response.status} ${errorText}`);
        } else {
          const result = await response.json();
          console.log(`Assignment ${i} success:`, result);
        }
      }
      
      optimizeMutation.mutate();
    } catch (error) {
      console.error("Assignment saving error:", error);
      setIsOptimizing(false);
      toast({
        title: "Assignment failed",
        description: `Failed to save pre-assignments: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const getEventKey = (event: string, ageCategory: number, gender: string) => {
    return `${event}_${ageCategory}_${gender}`;
  };

  const getRelayKey = (relayName: string, ageCategory: number, gender: string, position: number, stroke?: string) => {
    return `${relayName}_${ageCategory}_${gender}_${position}${stroke ? `_${stroke}` : ''}`;
  };

  const getEligibleSwimmers = (event: string, ageCategory: number, gender: string) => {
    return availableSwimmers.filter(swimmer => {
      // Convert M/F to Male/Female to match swimmer data
      const matchGender = gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender;
      
      // For Open events (age category 99), include all swimmers of that gender (no age restriction)
      if (ageCategory === 99) {
        return swimmer.gender === matchGender;
      }
      // For XU age categories (11U, 13U, 15U, etc.), include swimmers aged X and under
      return swimmer.gender === matchGender && swimmer.age <= ageCategory;
    });
  };

  if (!isActive) return null;

  // Show loading state while events are being fetched
  if (eventsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading events...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if events failed to load
  if (eventsError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Failed to load events</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }



  // Show message if no events are available (both individual and relay are empty or missing)
  if (!events || !Array.isArray(events.individual) || !Array.isArray(events.relay) || 
      (events.individual.length === 0 && events.relay.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          {/* Team Context Header */}
          {selectedTeam && (
            <div className="mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBackToSquadSelection}
                className="mb-3"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Squad Selection
              </Button>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">{selectedTeam.name}</h3>
                <p className="text-sm text-blue-700">
                  {getCompetitionTypeDisplay(selectedTeam.competitionType as any)}
                  {selectedTeam.maxIndividualEvents && ` • Max ${selectedTeam.maxIndividualEvents} events per swimmer`}
                </p>
              </div>
            </div>
          )}
          
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">No events available for this competition</div>
            <Button 
              onClick={() => {
                setIsOptimizing(true);
                optimizeMutation.mutate();
              }}
              disabled={isOptimizing}
            >
              {isOptimizing ? "Processing..." : "Continue to Results"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate counts now that we know events exists and is properly loaded
  const assignedCount = Object.values(eventAssignments).filter(Boolean).length + 
                       Object.values(relayAssignments).filter(Boolean).length;
  const totalEvents = (events?.individual?.length || 0) + (events?.relay?.length || 0) * 4;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        {/* Team Context Header */}
        {selectedTeam && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBackToSquadSelection}
              className="mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Squad Selection
            </Button>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">{selectedTeam.name}</h3>
              <p className="text-sm text-blue-700">
                {getCompetitionTypeDisplay(selectedTeam.competitionType as any)}
                {selectedTeam.maxIndividualEvents && ` • Max ${selectedTeam.maxIndividualEvents} events per swimmer`}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <i className="fas fa-clipboard-list text-primary-500 mr-3"></i>
            <h2 className="text-lg font-semibold text-gray-900">Step 3: Predetermined Event Assignment</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{assignedCount} assigned</span> • 
              <span className="font-medium text-warning">{totalEvents - assignedCount} auto-optimized</span>
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setEventAssignments({});
                setRelayAssignments({});
              }}
              className="text-primary-500 hover:text-primary-600"
            >
              Clear All Assignments
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Individual Events */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Individual Events</h3>
            <div className="space-y-3">
              {events?.individual.map((event) => {
                const eventKey = getEventKey(event.event, event.ageCategory, event.gender);
                const assignedSwimmerId = eventAssignments[eventKey];
                const eligibleSwimmers = getEligibleSwimmers(event.event, event.ageCategory, event.gender);
                const isAssigned = !!assignedSwimmerId;

                return (
                  <div 
                    key={eventKey}
                    className={`border rounded-lg p-4 ${
                      isAssigned ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {event.ageCategory === 99 ? 'Open' : `${event.ageCategory}U`} {event.gender} {event.event}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isAssigned 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isAssigned ? 'Assigned' : 'Individual'}
                      </span>
                    </div>
                    <Select 
                      value={assignedSwimmerId?.toString() || "auto"} 
                      onValueChange={(value) => {
                        setEventAssignments(prev => ({
                          ...prev,
                          [eventKey]: value === "auto" ? null : parseInt(value)
                        }));
                      }}
                    >
                      <SelectTrigger className={isAssigned ? 'border-primary-300 bg-white' : ''}>
                        <SelectValue placeholder="Auto-optimize (recommended)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-optimize (recommended)</SelectItem>
                        {eligibleSwimmers.map(swimmer => (
                          <SelectItem key={swimmer.id} value={swimmer.id.toString()}>
                            {swimmer.firstName} {swimmer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Relay Events */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Relay Events</h3>
            <div className="space-y-3">
              {events?.relay.map((relay) => {
                const relayPositions = relay.event.includes('Medley') 
                  ? ['Backstroke', 'Breaststroke', 'Butterfly', 'Freestyle']
                  : relay.event.includes('6x')
                    ? ['Swimmer 1', 'Swimmer 2', 'Swimmer 3', 'Swimmer 4', 'Swimmer 5', 'Swimmer 6']
                    : ['Swimmer 1', 'Swimmer 2', 'Swimmer 3', 'Swimmer 4'];
                
                const hasAssignments = relayPositions.some((_, position) => {
                  const key = getRelayKey(relay.event, relay.ageCategory, relay.gender, position + 1);
                  return relayAssignments[key];
                });

                return (
                  <div 
                    key={`${relay.event}_${relay.ageCategory}_${relay.gender}`}
                    className={`border rounded-lg p-4 ${
                      hasAssignments ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">
                        {relay.ageCategory === 99 ? 'Open' : `${relay.ageCategory}U`} {relay.gender} {relay.event}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        hasAssignments 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {hasAssignments ? 'Assigned' : 'Relay'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {relayPositions.map((label, position) => {
                        const relayKey = getRelayKey(relay.event, relay.ageCategory, relay.gender, position + 1, 
                          relay.event.includes('Medley') ? label : undefined);
                        const eligibleSwimmers = getEligibleSwimmers('50m Freestyle', relay.ageCategory, relay.gender);
                        
                        return (
                          <div key={relayKey}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                            <Select 
                              value={relayAssignments[relayKey]?.toString() || "auto"} 
                              onValueChange={(value) => {
                                setRelayAssignments(prev => ({
                                  ...prev,
                                  [relayKey]: value === "auto" ? null : parseInt(value)
                                }));
                              }}
                            >
                              <SelectTrigger className={`text-sm ${hasAssignments ? 'border-primary-300 bg-white' : ''}`}>
                                <SelectValue placeholder="Auto-optimize" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto-optimize</SelectItem>
                                {eligibleSwimmers.map(swimmer => (
                                  <SelectItem key={swimmer.id} value={swimmer.id.toString()}>
                                    {swimmer.firstName} {swimmer.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <Button 
            variant="outline"
            onClick={onBackToSquadSelection} // Fixed: Now properly navigates back to squad selection step
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back to Squad Selection
          </Button>
          <Button 
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="bg-success hover:bg-green-600 text-white px-8 py-3 font-medium"
          >
            {isOptimizing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Optimising...
              </>
            ) : (
              <>
                <i className="fas fa-play mr-2"></i>Run Team Optimisation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
