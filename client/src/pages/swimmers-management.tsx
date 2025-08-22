import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { Link } from "wouter";
import type { SwimmersRegistry } from "@shared/schema";

export default function SwimmersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSwimmer, setNewSwimmer] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    asaNo: "",
  });
  const { toast } = useToast();

  // Fetch swimmers registry
  const { data: swimmers = [], isLoading } = useQuery({
    queryKey: ["/api/swimmers-registry"],
    queryFn: () => 
      fetch("/api/swimmers-registry").then((res) => {
        if (!res.ok) throw new Error('Failed to fetch swimmers');
        return res.json();
      }) as Promise<SwimmersRegistry[]>,
  });

  // Add swimmer mutation
  const addSwimmerMutation = useMutation({
    mutationFn: async (swimmer: typeof newSwimmer) => {
      const response = await apiRequest("POST", "/api/swimmers-registry", swimmer);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swimmers-registry"] });
      setIsAddDialogOpen(false);
      setNewSwimmer({ firstName: "", lastName: "", gender: "", asaNo: "" });
      toast({
        title: "Success",
        description: "Swimmer added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add swimmer",
        variant: "destructive",
      });
    },
  });

  // Delete swimmer mutation
  const deleteSwimmerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/swimmers-registry/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swimmers-registry"] });
      toast({
        title: "Success",
        description: "Swimmer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete swimmer",
        variant: "destructive",
      });
    },
  });

  // Filter swimmers based on search term
  const filteredSwimmers = swimmers.filter((swimmer) =>
    `${swimmer.firstName} ${swimmer.lastName} ${swimmer.asaNo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleAddSwimmer = () => {
    if (!newSwimmer.firstName || !newSwimmer.lastName || !newSwimmer.asaNo || !newSwimmer.gender) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addSwimmerMutation.mutate(newSwimmer);
  };

  const handleDeleteSwimmer = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteSwimmerMutation.mutate(id);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">Swimmers Registry</h1>
            <p className="text-sm text-blue-700">
              Manage the swimmers database used for gender lookup during CSV uploads. 
              This registry is used to automatically determine swimmer genders when processing new format CSV files.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or ASA number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Swimmer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Swimmer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newSwimmer.firstName}
                        onChange={(e) => setNewSwimmer({ ...newSwimmer, firstName: e.target.value })}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newSwimmer.lastName}
                        onChange={(e) => setNewSwimmer({ ...newSwimmer, lastName: e.target.value })}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="asaNo">ASA Number *</Label>
                    <Input
                      id="asaNo"
                      value={newSwimmer.asaNo}
                      onChange={(e) => setNewSwimmer({ ...newSwimmer, asaNo: e.target.value })}
                      placeholder="ASA membership number"
                    />
                  </div>


                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={newSwimmer.gender}
                      onValueChange={(value) => setNewSwimmer({ ...newSwimmer, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddSwimmer}
                    disabled={addSwimmerMutation.isPending}
                  >
                    {addSwimmerMutation.isPending ? "Adding..." : "Add Swimmer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Swimmers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Swimmers Registry ({filteredSwimmers.length} swimmers)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading swimmers...
              </div>
            ) : filteredSwimmers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? "No swimmers match your search." : "No swimmers in the registry yet."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>ASA Number</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSwimmers.map((swimmer) => (
                    <TableRow key={swimmer.id}>
                      <TableCell className="font-medium">{swimmer.firstName}</TableCell>
                      <TableCell>{swimmer.lastName}</TableCell>
                      <TableCell className="font-mono">{swimmer.asaNo}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          swimmer.gender === 'Male' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {swimmer.gender}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSwimmer(swimmer.id, `${swimmer.firstName} ${swimmer.lastName}`)}
                          disabled={deleteSwimmerMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}