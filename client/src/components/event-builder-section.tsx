import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  INDIVIDUAL_EVENT_TYPES, 
  RELAY_TYPES, 
  RELAY_DISTANCES, 
  CUSTOM_AGE_GROUPS, 
  GENDER_OPTIONS 
} from "@shared/constants";
import type { Team } from "@shared/schema";

interface CustomEvent {
  id: string;
  type: 'individual' | 'relay';
  eventType?: string;
  relayType?: string;
  distancePerSwimmer?: number;
  swimmerCount?: number;
  ageGroup: number;
  gender: 'Male' | 'Female';
}

interface EventBuilderSectionProps {
  selectedTeam: Team;
  onEventsConfirmed: () => void;
  onBackToTeamSelection: () => void;
}

export default function EventBuilderSection({ 
  selectedTeam, 
  onEventsConfirmed, 
  onBackToTeamSelection 
}: EventBuilderSectionProps) {
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'individual' | 'relay'>('individual');
  const [maxIndividualEvents, setMaxIndividualEvents] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Individual event form state
  const [individualForm, setIndividualForm] = useState({
    eventType: '',
    ageGroup: '',
    gender: ''
  });

  // Relay event form state
  const [relayForm, setRelayForm] = useState({
    relayType: '',
    distancePerSwimmer: '',
    swimmerCount: 4,
    ageGroup: '',
    gender: ''
  });

  const generateEventId = () => `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addIndividualEvent = () => {
    if (!individualForm.eventType || !individualForm.ageGroup || !individualForm.gender) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields for the individual event.",
        variant: "destructive"
      });
      return;
    }

    const ageGroup = parseInt(individualForm.ageGroup);
    const gendersToAdd = individualForm.gender === 'Both' ? ['Male', 'Female'] : [individualForm.gender];

    const newEvents = gendersToAdd.map(gender => ({
      id: generateEventId(),
      type: 'individual' as const,
      eventType: individualForm.eventType,
      ageGroup,
      gender: gender as 'Male' | 'Female'
    }));

    setEvents(prev => [...prev, ...newEvents]);
    setIndividualForm({ eventType: '', ageGroup: '', gender: '' });

    toast({
      title: "Event Added",
      description: `${newEvents.length} individual event(s) added successfully.`,
    });
  };

  const addRelayEvent = () => {
    if (!relayForm.relayType || !relayForm.distancePerSwimmer || !relayForm.swimmerCount || !relayForm.ageGroup || !relayForm.gender) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all fields for the relay event.",
        variant: "destructive"
      });
      return;
    }

    const ageGroup = parseInt(relayForm.ageGroup);
    const distancePerSwimmer = parseInt(relayForm.distancePerSwimmer);
    const gendersToAdd = relayForm.gender === 'Both' ? ['Male', 'Female'] : [relayForm.gender];

    const newEvents = gendersToAdd.map(gender => ({
      id: generateEventId(),
      type: 'relay' as const,
      relayType: relayForm.relayType,
      distancePerSwimmer,
      swimmerCount: relayForm.swimmerCount,
      ageGroup,
      gender: gender as 'Male' | 'Female'
    }));

    setEvents(prev => [...prev, ...newEvents]);
    setRelayForm({ relayType: '', distancePerSwimmer: '', swimmerCount: 4, ageGroup: '', gender: '' });

    toast({
      title: "Relay Added",
      description: `${newEvents.length} relay event(s) added successfully.`,
    });
  };

  const removeEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast({
      title: "Event Removed",
      description: "Event has been removed from your competition.",
    });
  };

  const formatEventDisplay = (event: CustomEvent) => {
    const ageDisplay = CUSTOM_AGE_GROUPS.find(ag => ag.value === event.ageGroup)?.label || event.ageGroup.toString();
    
    if (event.type === 'individual') {
      return `${event.eventType} - ${ageDisplay} ${event.gender}`;
    } else {
      return `${event.swimmerCount}x${event.distancePerSwimmer}m ${event.relayType} - ${ageDisplay} ${event.gender}`;
    }
  };

  const saveCustomEvents = async () => {
    if (events.length === 0) {
      toast({
        title: "No Events",
        description: "Please add at least one event to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Format events for backend storage
      const formattedEvents = events.map(event => {
        if (event.type === 'individual') {
          return {
            event: event.eventType!,
            ageCategory: event.ageGroup,
            gender: event.gender,
            isRelay: false
          };
        } else {
          return {
            event: `${event.swimmerCount} x ${event.distancePerSwimmer}m ${event.relayType}`,
            ageCategory: event.ageGroup,
            gender: event.gender,
            isRelay: true
          };
        }
      });

      // Save events to team
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customEvents: JSON.stringify(formattedEvents),
          maxIndividualEvents,
          currentStep: 1 // Move to file upload step
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save custom events');
      }

      // Save events to teamEvents table for optimization script
      await fetch(`/api/teams/${selectedTeam.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: formattedEvents })
      });

      toast({
        title: "Events Saved",
        description: `Successfully saved ${events.length} events to your competition.`,
      });

      onEventsConfirmed();
    } catch (error) {
      console.error('Error saving events:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save events. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const individualEvents = events.filter(e => e.type === 'individual');
  const relayEvents = events.filter(e => e.type === 'relay');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Build Your Competition Events
          </CardTitle>
          <CardDescription>
            Create a custom event list for {selectedTeam.name}. Add individual events and relays with specific age groups and genders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Individual Events Setting */}
          <div className="space-y-2">
            <Label htmlFor="maxEvents">Maximum Individual Events per Swimmer</Label>
            <Input
              id="maxEvents"
              type="number"
              min="1"
              max="10"
              value={maxIndividualEvents}
              onChange={(e) => setMaxIndividualEvents(parseInt(e.target.value) || 2)}
              placeholder="e.g. 2"
              className="w-32"
            />
          </div>

          {/* Event Builder Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'individual' | 'relay')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Individual Events
              </TabsTrigger>
              <TabsTrigger value="relay" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Relay Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select 
                    value={individualForm.eventType} 
                    onValueChange={(value) => setIndividualForm(prev => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIVIDUAL_EVENT_TYPES.map(eventType => (
                        <SelectItem key={eventType} value={eventType}>
                          {eventType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Age Group</Label>
                  <Select 
                    value={individualForm.ageGroup} 
                    onValueChange={(value) => setIndividualForm(prev => ({ ...prev, ageGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_AGE_GROUPS.map(ageGroup => (
                        <SelectItem key={ageGroup.value} value={ageGroup.value.toString()}>
                          {ageGroup.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={individualForm.gender} 
                    onValueChange={(value) => setIndividualForm(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(gender => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3">
                  <Button onClick={addIndividualEvent} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Individual Event
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="relay" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label>Relay Type</Label>
                  <Select 
                    value={relayForm.relayType} 
                    onValueChange={(value) => setRelayForm(prev => ({ ...prev, relayType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELAY_TYPES.map(relayType => (
                        <SelectItem key={relayType} value={relayType}>
                          {relayType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Swimmers</Label>
                  <Input
                    type="number"
                    min="2"
                    max="8"
                    value={relayForm.swimmerCount}
                    onChange={(e) => setRelayForm(prev => ({ ...prev, swimmerCount: parseInt(e.target.value) || 4 }))}
                    placeholder="4"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Distance per Swimmer</Label>
                  <Select 
                    value={relayForm.distancePerSwimmer} 
                    onValueChange={(value) => setRelayForm(prev => ({ ...prev, distancePerSwimmer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELAY_DISTANCES.map(distance => (
                        <SelectItem key={distance} value={distance.toString()}>
                          {distance}m
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Age Group</Label>
                  <Select 
                    value={relayForm.ageGroup} 
                    onValueChange={(value) => setRelayForm(prev => ({ ...prev, ageGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_AGE_GROUPS.map(ageGroup => (
                        <SelectItem key={ageGroup.value} value={ageGroup.value.toString()}>
                          {ageGroup.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={relayForm.gender} 
                    onValueChange={(value) => setRelayForm(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(gender => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-5">
                  <Button onClick={addRelayEvent} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Relay Event
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Event List Display */}
          {events.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competition Events ({events.length})</h3>
              
              {individualEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Individual Events ({individualEvents.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {individualEvents.map(event => (
                      <Badge key={event.id} variant="secondary" className="flex items-center justify-between p-2">
                        <span className="text-sm">{formatEventDisplay(event)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEvent(event.id)}
                          className="h-4 w-4 p-0 ml-2 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {relayEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Relay Events ({relayEvents.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {relayEvents.map(event => (
                      <Badge key={event.id} variant="secondary" className="flex items-center justify-between p-2">
                        <span className="text-sm">{formatEventDisplay(event)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEvent(event.id)}
                          className="h-4 w-4 p-0 ml-2 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBackToTeamSelection}
        >
          Back to Team Selection
        </Button>
        <Button 
          onClick={saveCustomEvents} 
          disabled={events.length === 0 || isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? "Saving..." : "Continue to File Upload"}
        </Button>
      </div>
    </div>
  );
}