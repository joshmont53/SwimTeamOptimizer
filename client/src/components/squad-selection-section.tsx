import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Swimmer } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface SquadSelectionSectionProps {
  swimmers: Swimmer[];
  isActive: boolean;
  onSquadConfirmed: () => void;
  refetchSwimmers: () => void;
}

export default function SquadSelectionSection({ 
  swimmers, 
  isActive, 
  onSquadConfirmed, 
  refetchSwimmers 
}: SquadSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const { toast } = useToast();

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const response = await apiRequest('PATCH', `/api/swimmers/${id}`, { isAvailable });
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
      
      const matchesAge = ageFilter === "all" || 
        (ageFilter === "11-12" && swimmer.age >= 11 && swimmer.age <= 12) ||
        (ageFilter === "13-14" && swimmer.age >= 13 && swimmer.age <= 14) ||
        (ageFilter === "15-16" && swimmer.age >= 15 && swimmer.age <= 16) ||
        (ageFilter === "17+" && swimmer.age >= 17);
      
      return matchesSearch && matchesGender && matchesAge;
    });
  }, [swimmers, searchTerm, genderFilter, ageFilter]);

  const availableCount = swimmers.filter(s => s.isAvailable).length;
  const unavailableCount = swimmers.length - availableCount;

  const handleAvailabilityChange = (swimmer: Swimmer, isAvailable: boolean) => {
    updateAvailabilityMutation.mutate({ id: swimmer.id, isAvailable });
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
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="11-12">11-12</SelectItem>
                <SelectItem value="13-14">13-14</SelectItem>
                <SelectItem value="15-16">15-16</SelectItem>
                <SelectItem value="17+">17+</SelectItem>
              </SelectContent>
            </Select>
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Age</th>
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
                    {swimmer.age}
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
              onClick={() => window.location.reload()}
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
