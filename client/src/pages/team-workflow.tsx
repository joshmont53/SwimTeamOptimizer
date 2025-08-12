import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Team, Swimmer } from "@shared/schema";
import { getCompetitionTypeDisplay } from "@shared/constants";

import FileUploadSection from "@/components/file-upload-section";
import SquadSelectionSection from "@/components/squad-selection-section";
import EventAssignmentSection from "@/components/event-assignment-section";
import ResultsSection from "@/components/results-section";
import ProgressIndicator from "@/components/progress-indicator";

export default function TeamWorkflow() {
  const [match, params] = useRoute("/team/:id/workflow");
  const [, setLocation] = useLocation();
  const teamId = params?.id ? parseInt(params.id) : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  // Fetch team data
  const { data: team } = useQuery<Team>({
    queryKey: ["/api/teams", teamId],
    enabled: !!teamId,
  });

  const { data: swimmers = [], refetch: refetchSwimmers } = useQuery<Swimmer[]>({
    queryKey: ["/api/swimmers", teamId],
    enabled: currentStep >= 2 && !!teamId,
  });

  // Fetch optimization results for completed teams
  const { data: storedResults, isLoading: loadingStoredResults } = useQuery({
    queryKey: [`/api/teams/${teamId}/optimization-results`],
    enabled: !!teamId && team?.status === "selected",
  });

  // If no team ID or team not found, redirect to teams list
  useEffect(() => {
    if (!match || !teamId) {
      setLocation("/");
    }
  }, [match, teamId, setLocation]);

  // Determine initial step based on team state
  useEffect(() => {
    if (team?.status === "selected") {
      setCurrentStep(4); // Show results if complete
    } else if (team && swimmers.length > 0) {
      setCurrentStep(3); // Go to event assignment if swimmers exist
    } else if (team) {
      setCurrentStep(1); // Start with file upload
    }
  }, [team, swimmers]);

  // Load stored results when they become available
  useEffect(() => {
    if (storedResults && !optimizationResults) {
      setOptimizationResults(storedResults);
    }
  }, [storedResults, optimizationResults]);

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
    
    // Mark team as complete
    if (teamId && team) {
      fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isComplete: true })
      });
    }
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

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {getCompetitionTypeDisplay(team.competitionType as any)}
                {team.maxIndividualEvents && ` • Max ${team.maxIndividualEvents} events per swimmer`}
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 1 && (
            <FileUploadSection 
              isActive={currentStep === 1}
              onFileUploaded={handleFileUploaded}
              selectedTeam={team}
            />
          )}

          {currentStep === 2 && (
            <SquadSelectionSection 
              swimmers={swimmers}
              isActive={currentStep === 2}
              onSquadConfirmed={handleSquadConfirmed}
              onBackToFileUpload={handleBackToFileUpload}
              refetchSwimmers={refetchSwimmers}
              selectedTeam={team}
            />
          )}

          {currentStep === 3 && (
            <EventAssignmentSection 
              swimmers={swimmers}
              isActive={currentStep === 3}
              onOptimizationComplete={handleOptimizationComplete}
              onBackToSquadSelection={handleBackToSquadSelection}
              selectedTeam={team}
            />
          )}

          {currentStep === 4 && (
            <ResultsSection 
              results={optimizationResults}
              onBackToEventAssignment={handleBackToEventAssignment}
              selectedTeam={team}
            />
          )}
        </div>
      </div>
    </div>
  );
}