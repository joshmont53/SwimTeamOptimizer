import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Swimmer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventAssignmentSectionProps {
  swimmers: Swimmer[];
  isActive: boolean;
  onOptimizationComplete: (results: any) => void;
}

interface Events {
  individual: Array<{
    event: string;
    ageCategory: number;
    gender: string;
  }>;
  relay: Array<{
    relayName: string;
    ageCategory: number;
    gender: string;
  }>;
}

export default function EventAssignmentSection({ 
  swimmers, 
  isActive, 
  onOptimizationComplete 
}: EventAssignmentSectionProps) {
  const [eventAssignments, setEventAssignments] = useState<Record<string, number | null>>({});
  const [relayAssignments, setRelayAssignments] = useState<Record<string, number | null>>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const { data: events } = useQuery<Events>({
    queryKey: ["/api/events"],
    enabled: isActive,
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      console.log('Frontend: Starting optimization request');
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Optimization failed');
      }
      
      return response.json();
    },
    onSuccess: (results) => {
      setIsOptimizing(false);
      onOptimizationComplete(results);
      toast({
        title: "Optimization complete",
        description: "Team selection has been optimized successfully",
      });
    },
    onError: (error: any) => {
      setIsOptimizing(false);
      toast({
        title: "Optimization failed",
        description: error.message || "Failed to run optimization",
        variant: "destructive",
      });
    }
  });

  const availableSwimmers = swimmers.filter(s => s.isAvailable);

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    optimizeMutation.mutate();
  };

  const getEventKey = (event: string, ageCategory: number, gender: string) => {
    return `${event}_${ageCategory}_${gender}`;
  };

  const getRelayKey = (relayName: string, ageCategory: number, gender: string, position: number, stroke?: string) => {
    return `${relayName}_${ageCategory}_${gender}_${position}${stroke ? `_${stroke}` : ''}`;
  };

  const getEligibleSwimmers = (event: string, ageCategory: number, gender: string) => {
    return availableSwimmers.filter(swimmer => {
      // For 16U events, include all swimmers of that gender (no age restriction)
      if (ageCategory === 16) {
        return swimmer.gender === gender;
      }
      // For other age categories, use normal age restrictions
      return swimmer.gender === gender && swimmer.age <= ageCategory;
    });
  };

  const assignedCount = Object.values(eventAssignments).filter(Boolean).length + 
                       Object.values(relayAssignments).filter(Boolean).length;
  const totalEvents = (events?.individual.length || 0) + (events?.relay.length || 0) * 4;

  if (!isActive) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
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
                
                // Debug logging
                console.log(`Event: ${event.ageCategory}U ${event.gender} ${event.event}`);
                console.log(`Available swimmers: ${availableSwimmers.length}`);
                console.log(`Sample swimmer genders:`, availableSwimmers.slice(0, 3).map(s => s.gender));
                console.log(`Looking for gender: "${event.gender}"`);
                console.log(`Eligible swimmers: ${eligibleSwimmers.length}`);

                return (
                  <div 
                    key={eventKey}
                    className={`border rounded-lg p-4 ${
                      isAssigned ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {event.ageCategory}U {event.gender} {event.event}
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
                const relayPositions = relay.relayName.includes('Medley') 
                  ? ['Backstroke', 'Breaststroke', 'Butterfly', 'Freestyle']
                  : ['Swimmer 1', 'Swimmer 2', 'Swimmer 3', 'Swimmer 4'];
                
                const hasAssignments = relayPositions.some((_, position) => {
                  const key = getRelayKey(relay.relayName, relay.ageCategory, relay.gender, position + 1);
                  return relayAssignments[key];
                });

                return (
                  <div 
                    key={`${relay.relayName}_${relay.ageCategory}_${relay.gender}`}
                    className={`border rounded-lg p-4 ${
                      hasAssignments ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">
                        {relay.ageCategory}U {relay.gender} {relay.relayName}
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
                        const relayKey = getRelayKey(relay.relayName, relay.ageCategory, relay.gender, position + 1, 
                          relay.relayName.includes('Medley') ? label : undefined);
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
            onClick={() => window.history.back()}
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
                <i className="fas fa-spinner fa-spin mr-2"></i>Optimizing...
              </>
            ) : (
              <>
                <i className="fas fa-play mr-2"></i>Run Team Optimization
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
