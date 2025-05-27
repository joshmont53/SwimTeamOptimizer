import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Swimmer } from "@shared/schema";
import ProgressIndicator from "@/components/progress-indicator";
import FileUploadSection from "@/components/file-upload-section";
import SquadSelectionSection from "@/components/squad-selection-section";
import EventAssignmentSection from "@/components/event-assignment-section";
import ResultsSection from "@/components/results-section";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  const { data: swimmers = [], refetch: refetchSwimmers } = useQuery<Swimmer[]>({
    queryKey: ["/api/swimmers"],
    enabled: currentStep >= 2,
  });

  const handleFileUploaded = () => {
    setCurrentStep(2);
    setLastUpdated(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }));
    refetchSwimmers();
  };

  const handleSquadConfirmed = () => {
    setCurrentStep(3);
  };

  const handleOptimizationComplete = (results: any) => {
    setOptimizationResults(results);
    setCurrentStep(4);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-roboto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-swimmer text-primary-500 text-2xl mr-3"></i>
              <h1 className="text-xl font-semibold text-gray-900">Swimming Team Optimizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Last updated: <span>{lastUpdated || "Not updated"}</span>
              </span>
              <button 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={!optimizationResults}
              >
                <i className="fas fa-download mr-2"></i>Export Results
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} />

        {/* Step 1: File Upload */}
        <FileUploadSection 
          isActive={currentStep === 1}
          onFileUploaded={handleFileUploaded}
        />

        {/* Step 2: Squad Selection */}
        {currentStep >= 2 && (
          <SquadSelectionSection 
            swimmers={swimmers}
            isActive={currentStep === 2}
            onSquadConfirmed={handleSquadConfirmed}
            refetchSwimmers={refetchSwimmers}
          />
        )}

        {/* Step 3: Event Assignment */}
        {currentStep >= 3 && (
          <EventAssignmentSection 
            swimmers={swimmers}
            isActive={currentStep === 3}
            onOptimizationComplete={handleOptimizationComplete}
          />
        )}

        {/* Step 4: Results */}
        {currentStep >= 4 && optimizationResults && (
          <ResultsSection results={optimizationResults} />
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 space-y-3">
        <button className="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-3 shadow-lg transition-colors" title="Help">
          <i className="fas fa-question w-6 h-6 text-center"></i>
        </button>
        <button className="bg-success hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-colors" title="Save Progress">
          <i className="fas fa-save w-6 h-6 text-center"></i>
        </button>
      </div>
    </div>
  );
}
