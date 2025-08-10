import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Swimmer, Team } from "@shared/schema";
import ProgressIndicator from "@/components/progress-indicator";
import FileUploadSection from "@/components/file-upload-section";
import SquadSelectionSection from "@/components/squad-selection-section";
import EventAssignmentSection from "@/components/event-assignment-section";
import ResultsSection from "@/components/results-section";
import TeamSelectionSection from "@/components/team-selection-section";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0); // Start with team selection
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { data: swimmers = [], refetch: refetchSwimmers } = useQuery<Swimmer[]>({
    queryKey: ["/api/swimmers"],
    enabled: currentStep >= 2,
  });

  const handleTeamSelected = (team: Team) => {
    setSelectedTeam(team);
    setCurrentStep(1); // Move to file upload
  };

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

  const handleBackToEventAssignment = () => {
    setCurrentStep(3);
  };

  const handleBackToFileUpload = () => {
    setCurrentStep(1);
  };

  const handleBackToSquadSelection = () => {
    setCurrentStep(2);
  };

  const handleBackToTeamSelection = () => {
    setCurrentStep(0);
    setSelectedTeam(null);
    setOptimizationResults(null);
    // Force re-fetch of swimmers data by triggering a page refresh
    refetchSwimmers();
  };

  return (
    <div className="bg-gray-50 min-h-screen font-roboto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-swimmer text-primary-500 text-2xl mr-3"></i>
              <h1 className="text-xl font-semibold text-gray-900">Swimming Team Optimiser</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Last updated: <span>{lastUpdated || "Not updated"}</span>
              </span>
              {/* Home Navigation - only show when not on team selection */}
              {currentStep > 0 && (
                <button 
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md transition-colors border border-blue-600 hover:bg-blue-50"
                  onClick={handleBackToTeamSelection}
                >
                  <i className="fas fa-home mr-1"></i>Home
                </button>
              )}
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
        {/* Progress Indicator - only show for steps 1-4 */}
        {currentStep > 0 && <ProgressIndicator currentStep={currentStep} />}

        {/* Step 0: Team Selection */}
        {currentStep === 0 && (
          <TeamSelectionSection 
            onTeamSelected={handleTeamSelected}
          />
        )}

        {/* Step 1: File Upload */}
        {currentStep === 1 && selectedTeam && (
          <FileUploadSection 
            isActive={true}
            onFileUploaded={handleFileUploaded}
            selectedTeam={selectedTeam}
            onBackToTeamSelection={handleBackToTeamSelection}
          />
        )}

        {/* Step 2: Squad Selection */}
        {currentStep >= 2 && (
          <SquadSelectionSection 
            swimmers={swimmers}
            isActive={currentStep === 2}
            onSquadConfirmed={handleSquadConfirmed}
            onBackToFileUpload={handleBackToFileUpload}
            refetchSwimmers={refetchSwimmers}
            selectedTeam={selectedTeam || undefined}
          />
        )}

        {/* Step 3: Event Assignment */}
        {currentStep >= 3 && (
          <EventAssignmentSection 
            swimmers={swimmers}
            isActive={currentStep === 3}
            onOptimizationComplete={handleOptimizationComplete}
            onBackToSquadSelection={handleBackToSquadSelection}
            selectedTeam={selectedTeam || undefined}
          />
        )}

        {/* Step 4: Results */}
        {currentStep >= 4 && optimizationResults && (
          <ResultsSection 
            results={optimizationResults} 
            onBackToEventAssignment={handleBackToEventAssignment}
            selectedTeam={selectedTeam || undefined}
            onBackToHome={handleBackToTeamSelection}
          />
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
