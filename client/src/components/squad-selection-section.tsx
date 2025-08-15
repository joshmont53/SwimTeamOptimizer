import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Swimmer, Team } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { getCompetitionTypeDisplay } from "@shared/constants";
import { calculateCompetitionAge } from "@/lib/utils";

interface SquadSelectionSectionProps {
  swimmers: Swimmer[];
  isActive: boolean;
  onSquadConfirmed: () => void;
  onBackToFileUpload: () => void;
  refetchSwimmers: () => void;
  selectedTeam?: Team;
}

export default function SquadSelectionSection({ 
  swimmers, 
  isActive, 
  onSquadConfirmed, 
  onBackToFileUpload,
  refetchSwimmers,
  selectedTeam
}: SquadSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilters, setAgeFilters] = useState<string[]>([]);
  const { toast } = useToast();

  const ageOptions = [
    { value: "11-12", label: "11-12" },
    { value: "13-14", label: "13-14" },
    { value: "15-16", label: "15-16" },
    { value: "17+", label: "17+" }
  ];

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      if (!selectedTeam?.id) {
        throw new Error('No team selected');
      }
      const response = await apiRequest('PATCH', `/api/swimmers/${selectedTeam.id}/${id}`, { isAvailable });
      return response.json();
    },
    onSuccess: () => {
      refetchSwimmers();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update swimmer availability",
        variant: "destructive",
      });
    }
  });

  const filteredSwimmers = useMemo(() => {
    return swimmers.filter(swimmer => {
      const matchesSearch = !searchTerm || 
        `${swimmer.firstName} ${swimmer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        swimmer.asaNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGender = genderFilter === "all" || swimmer.gender === genderFilter;
      
      // Use competition age for filtering
      const competitionAge = calculateCompetitionAge(swimmer.dateOfBirth);
      
      // Multi-select age filtering - if no ages selected, show all
      const matchesAge = ageFilters.length === 0 || ageFilters.some(ageRange => {
        switch(ageRange) {
          case "11-12": return competitionAge >= 11 && competitionAge <= 12;
          case "13-14": return competitionAge >= 13 && competitionAge <= 14;
          case "15-16": return competitionAge >= 15 && competitionAge <= 16;
          case "17+": return competitionAge >= 17;
          default: return false;
        }
      });
      
      return matchesSearch && matchesGender && matchesAge;
    });
  }, [swimmers, searchTerm, genderFilter, ageFilters]);

  const availableCount = swimmers.filter(s => s.isAvailable).length;
  const unavailableCount = swimmers.length - availableCount;

  const handleAvailabilityChange = (swimmer: Swimmer, isAvailable: boolean) => {
    updateAvailabilityMutation.mutate({ id: swimmer.id, isAvailable });
  };

  const handleAgeFilterToggle = (ageRange: string) => {
    setAgeFilters(prev => 
      prev.includes(ageRange) 
        ? prev.filter(age => age !== ageRange)
        : [...prev, ageRange]
    );
  };

  const clearAgeFilters = () => {
    setAgeFilters([]);
  };

  const getAgeFilterDisplayText = () => {
    if (ageFilters.length === 0) return "All Ages";
    if (ageFilters.length === 1) return ageFilters[0];
    if (ageFilters.length === ageOptions.length) return "All Selected";
    return `${ageFilters.length} selected`;
  };

  const handleSelectAllAvailable = () => {
    filteredSwimmers.forEach(swimmer => {
      if (!swimmer.isAvailable) {
        updateAvailabilityMutation.mutate({ id: swimmer.id, isAvailable: true });
      }
    });
  };

  if (!isActive) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        {/* Team Context Header */}
        {selectedTeam && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBackToFileUpload}
              className="mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to File Upload
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
            <i className="fas fa-users text-primary-500 mr-3"></i>
            <h2 className="text-lg font-semibold text-gray-900">Step 2: Squad Selection</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              <span className="font-medium text-success">{availableCount} available</span> • 
              <span className="font-medium text-error ml-1">{unavailableCount} unavailable</span>
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSelectAllAvailable}
              className="text-primary-500 hover:text-primary-600"
            >
              Select All Available
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Input 
                type="text" 
                placeholder="Search swimmers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-40 justify-between"
                  role="combobox"
                >
                  <span className="truncate">{getAgeFilterDisplayText()}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Age Ranges</span>
                    {ageFilters.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAgeFilters}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {ageOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`age-${option.value}`}
                          checked={ageFilters.includes(option.value)}
                          onCheckedChange={() => handleAgeFilterToggle(option.value)}
                        />
                        <label
                          htmlFor={`age-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  <Checkbox 
                    checked={filteredSwimmers.length > 0 && filteredSwimmers.every(s => s.isAvailable)}
                    onCheckedChange={(checked) => {
                      filteredSwimmers.forEach(swimmer => {
                        if (swimmer.isAvailable !== checked) {
                          updateAvailabilityMutation.mutate({ id: swimmer.id, isAvailable: !!checked });
                        }
                      });
                    }}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Swimmer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Age (Competition)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Gender</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSwimmers.map(swimmer => (
                <tr key={swimmer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Checkbox 
                      checked={swimmer.isAvailable}
                      onCheckedChange={(checked) => handleAvailabilityChange(swimmer, !!checked)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className={`font-medium ${swimmer.isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                      {swimmer.firstName} {swimmer.lastName}
                    </div>
                    <div className={`text-sm ${swimmer.isAvailable ? 'text-gray-600' : 'text-gray-400'}`}>
                      ASA #{swimmer.asaNo}
                    </div>
                  </td>
                  <td className={`py-3 px-4 ${swimmer.isAvailable ? 'text-gray-700' : 'text-gray-500'}`}>
                    {calculateCompetitionAge(swimmer.dateOfBirth)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      swimmer.isAvailable 
                        ? swimmer.gender === 'Male' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {swimmer.gender}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      swimmer.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {swimmer.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {filteredSwimmers.length} of {swimmers.length} swimmers
          </span>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={onBackToFileUpload} // Fixed: Now properly navigates back to file upload step
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← Back to Upload
            </Button>
            <Button 
              onClick={onSquadConfirmed}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              Continue to Event Assignment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
