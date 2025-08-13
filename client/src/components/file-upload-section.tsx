import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import type { Team } from "@shared/schema";
import { getCompetitionTypeDisplay } from "@shared/constants";

interface FileUploadSectionProps {
  isActive: boolean;
  onFileUploaded: () => void;
  selectedTeam?: Team;
  onBackToTeamSelection?: () => void;
}

type LoadingPhase = 'idle' | 'uploading' | 'processing' | 'loading_county' | 'complete';

interface LoadingState {
  phase: LoadingPhase;
  message: string;
  estimatedDuration: string;
}

const loadingPhases: Record<LoadingPhase, LoadingState> = {
  idle: { phase: 'idle', message: '', estimatedDuration: '' },
  uploading: { phase: 'uploading', message: 'Uploading CSV file...', estimatedDuration: '~2 seconds' },
  processing: { phase: 'processing', message: 'Processing swimmer data...', estimatedDuration: '~3 seconds' },
  loading_county: { phase: 'loading_county', message: 'Loading qualifying times...', estimatedDuration: '~5 seconds' },
  complete: { phase: 'complete', message: 'Processing complete!', estimatedDuration: '' }
};

export default function FileUploadSection({ 
  isActive, 
  onFileUploaded, 
  selectedTeam,
  onBackToTeamSelection 
}: FileUploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{ swimmerCount: number; recordCount: number } | null>(null);
  const [currentLoadingPhase, setCurrentLoadingPhase] = useState<LoadingPhase>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedTeam?.id) {
        throw new Error('No team selected');
      }
      
      setCurrentLoadingPhase('uploading');
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Use team-specific upload endpoint
      const response = await fetch(`/api/upload-csv/${selectedTeam.id}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      setCurrentLoadingPhase('processing');
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
      
      setCurrentLoadingPhase('loading_county');
      // Load county times
      loadCountyTimesMutation.mutate();
    },
    onError: (error: any) => {
      setCurrentLoadingPhase('idle');
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
    onSuccess: (data) => {
      setCurrentLoadingPhase('complete');
      toast({
        title: "Success",
        description: `Loaded ${data.recordCount || 953} qualifying times`,
      });
      // Small delay to show completion state before transitioning
      setTimeout(() => {
        onFileUploaded();
      }, 800);
    },
    onError: (error: any) => {
      setCurrentLoadingPhase('idle');
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
        
        {currentLoadingPhase !== 'idle' ? (
          <LoadingStageIndicator currentPhase={currentLoadingPhase} uploadSuccess={uploadSuccess} />
        ) : (
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
              <>
                <i className="fas fa-folder-open mr-2"></i>Browse Files
              </>
            </button>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileInputChange}
            />
          </div>
        )}
        
        {uploadSuccess && currentLoadingPhase === 'idle' && (
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

// Loading Stage Indicator Component
interface LoadingStageIndicatorProps {
  currentPhase: LoadingPhase;
  uploadSuccess: { swimmerCount: number; recordCount: number } | null;
}

function LoadingStageIndicator({ currentPhase, uploadSuccess }: LoadingStageIndicatorProps) {
  const getCurrentStageInfo = () => {
    return loadingPhases[currentPhase];
  };

  const isPhaseComplete = (phase: LoadingPhase) => {
    const phases: LoadingPhase[] = ['uploading', 'processing', 'loading_county', 'complete'];
    const currentIndex = phases.indexOf(currentPhase);
    const phaseIndex = phases.indexOf(phase);
    return phaseIndex < currentIndex || currentPhase === 'complete';
  };

  const isPhaseActive = (phase: LoadingPhase) => {
    return phase === currentPhase;
  };

  const stageInfo = getCurrentStageInfo();

  return (
    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-8">
      <div className="text-center mb-6">
        <div className="mb-4">
          {currentPhase === 'complete' ? (
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          ) : (
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {stageInfo.message}
        </h3>
        {stageInfo.estimatedDuration && (
          <p className="text-sm text-gray-600">
            {stageInfo.estimatedDuration}
          </p>
        )}
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        <div className={`flex items-center ${isPhaseComplete('uploading') ? 'text-green-600' : isPhaseActive('uploading') ? 'text-blue-600' : 'text-gray-400'}`}>
          {isPhaseComplete('uploading') ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : isPhaseActive('uploading') ? (
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <div className="h-5 w-5 mr-3 rounded-full border-2 border-current" />
          )}
          <span className="text-sm font-medium">Upload CSV file</span>
        </div>

        <div className={`flex items-center ${isPhaseComplete('processing') ? 'text-green-600' : isPhaseActive('processing') ? 'text-blue-600' : 'text-gray-400'}`}>
          {isPhaseComplete('processing') ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : isPhaseActive('processing') ? (
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <div className="h-5 w-5 mr-3 rounded-full border-2 border-current" />
          )}
          <span className="text-sm font-medium">
            Process swimmer data
            {uploadSuccess && ` (${uploadSuccess.swimmerCount} swimmers, ${uploadSuccess.recordCount} records)`}
          </span>
        </div>

        <div className={`flex items-center ${isPhaseComplete('loading_county') ? 'text-green-600' : isPhaseActive('loading_county') ? 'text-blue-600' : 'text-gray-400'}`}>
          {isPhaseComplete('loading_county') ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : isPhaseActive('loading_county') ? (
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <div className="h-5 w-5 mr-3 rounded-full border-2 border-current" />
          )}
          <span className="text-sm font-medium">Load qualifying times</span>
        </div>

        <div className={`flex items-center ${currentPhase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
          {currentPhase === 'complete' ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : (
            <div className="h-5 w-5 mr-3 rounded-full border-2 border-current" />
          )}
          <span className="text-sm font-medium">Ready for squad selection</span>
        </div>
      </div>

      {currentPhase !== 'complete' && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Please do not close this page or navigate away while processing...
          </p>
        </div>
      )}
    </div>
  );
}
