import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Team } from "@shared/schema";
import { getCompetitionTypeDisplay } from "@shared/constants";

interface FileUploadSectionProps {
  isActive: boolean;
  onFileUploaded: () => void;
  selectedTeam?: Team;
  onBackToTeamSelection?: () => void;
}

export default function FileUploadSection({ 
  isActive, 
  onFileUploaded, 
  selectedTeam,
  onBackToTeamSelection 
}: FileUploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{ swimmerCount: number; recordCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use fetch directly for file uploads instead of apiRequest
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadSuccess({
        swimmerCount: data.swimmerCount,
        recordCount: data.recordCount
      });
      toast({
        title: "Upload successful",
        description: `Processed ${data.recordCount} records for ${data.swimmerCount} swimmers`,
      });
      
      // Load county times
      loadCountyTimesMutation.mutate();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    }
  });

  const loadCountyTimesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/load-county-times');
      return response.json();
    },
    onSuccess: () => {
      onFileUploaded();
    },
    onError: (error: any) => {
      toast({
        title: "Warning",
        description: "County times could not be loaded. Some features may be limited.",
        variant: "destructive",
      });
      onFileUploaded(); // Continue anyway
    }
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        {/* Team Context Header */}
        {selectedTeam && (
          <div className="mb-6">
            {onBackToTeamSelection && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBackToTeamSelection}
                className="mb-3"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Team Selection
              </Button>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">{selectedTeam.name}</h3>
              <p className="text-sm text-blue-700">
                {getCompetitionTypeDisplay(selectedTeam.competitionType as any)}
                {selectedTeam.maxIndividualEvents && ` • Max ${selectedTeam.maxIndividualEvents} events per swimmer`}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center mb-4">
          <i className="fas fa-upload text-primary-500 mr-3"></i>
          <h2 className="text-lg font-semibold text-gray-900">Step 1: Upload Member PBs</h2>
        </div>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mb-4">
            <i className="fas fa-file-csv text-4xl text-gray-400 mb-4"></i>
            <div className="text-lg font-medium text-gray-900 mb-2">Upload member_pbs.csv</div>
            <div className="text-sm text-gray-600 mb-4">
              Drag and drop your CSV file here, or click to browse
            </div>
          </div>
          
          <button 
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-folder-open mr-2"></i>Browse Files
              </>
            )}
          </button>
          
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileInputChange}
          />
        </div>
        
        {uploadSuccess && (
          <div className="mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <i className="fas fa-check-circle text-success mr-3"></i>
              <div>
                <div className="font-medium text-green-800">File uploaded successfully</div>
                <div className="text-sm text-green-600">
                  member_pbs.csv • {uploadSuccess.recordCount} records • {uploadSuccess.swimmerCount} swimmers
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
