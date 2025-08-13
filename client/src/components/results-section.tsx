import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Team } from "@shared/schema";
import { getCompetitionTypeDisplay } from "@shared/constants";
import * as XLSX from 'xlsx';

interface ResultsSectionProps {
  results: {
    individual: Array<{
      event: string;
      swimmer: string;
      time: string;
      index?: number;
      status?: string;
    }>;
    relay: Array<{
      relay: string;
      totalTime: string;
      swimmers: Array<{
        name: string;
        stroke?: string;
        time: string;
      }>;
    }>;
    stats?: {
      qualifyingTimes: number;
      averageIndex: number;
      relayTeams: number;
      totalEvents: number;
    };
  } | null;
  onBackToEventAssignment: () => void;
  selectedTeam?: Team;
  onBackToHome?: () => void;
}

export default function ResultsSection({ results, onBackToEventAssignment, selectedTeam, onBackToHome }: ResultsSectionProps) {
  // Show loading state if results are not available yet
  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading optimization results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = results.stats || {
    qualifyingTimes: results.individual.filter(r => r.status === 'QT').length,
    averageIndex: results.individual.length > 0 ? results.individual.reduce((acc, r) => acc + (r.index || 0), 0) / results.individual.length : 0,
    relayTeams: results.relay.length,
    totalEvents: results.individual.length + results.relay.length
  };

  const handleExport = () => {
    // Create worksheet data
    const worksheetData = [
      ["Event Type", "Event", "Swimmer(s)", "Time", "Status"]
    ];
    
    // Add individual events
    results.individual.forEach(result => {
      worksheetData.push([
        "Individual",
        result.event,
        result.swimmer,
        result.time,
        result.status || 'N/A'
      ]);
    });
    
    // Add relay events
    results.relay.forEach(result => {
      const swimmers = result.swimmers.map(s => `${s.name} (${s.time})`).join('; ');
      worksheetData.push([
        "Relay",
        result.relay,
        swimmers,
        result.totalTime,
        "Team"
      ]);
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Selection");

    // Generate filename using team name
    const teamName = selectedTeam?.name || 'team_selection';
    const filename = `${teamName}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Team Context Header */}
        {selectedTeam && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBackToEventAssignment}
              className="mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Event Assignment
            </Button>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">{selectedTeam.name} - Optimization Complete</h3>
              <p className="text-sm text-green-700">
                {getCompetitionTypeDisplay(selectedTeam.competitionType as any)}
                {selectedTeam.maxIndividualEvents && ` • Max ${selectedTeam.maxIndividualEvents} events per swimmer`}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <i className="fas fa-trophy text-warning mr-3"></i>
            <h2 className="text-lg font-semibold text-gray-900">Step 4: Optimisation Results</h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              <span className="font-medium text-success">{stats.totalEvents} events</span> • 
              <span className="font-medium">{stats.relayTeams} relays</span>
            </span>
            <Button 
              variant="outline" 
              onClick={onBackToHome || (() => window.location.reload())}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <i className="fas fa-home mr-2"></i>Back to Home
            </Button>
            <Button onClick={handleExport} className="bg-primary-500 hover:bg-primary-600 text-white">
              <i className="fas fa-file-export mr-2"></i>Export Team Sheet
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{stats.qualifyingTimes}</div>
            <div className="text-sm text-green-600">Qualifying Times</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">{stats.averageIndex.toFixed(2)}</div>
            <div className="text-sm text-blue-600">Average Index</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-700">{stats.relayTeams}</div>
            <div className="text-sm text-yellow-600">Relay Teams</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-700">{stats.totalEvents}</div>
            <div className="text-sm text-purple-600">Total Events</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Individual Events Results */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Individual Events</h3>
            <div className="space-y-2">
              {results.individual.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{result.event}</div>
                      <div className="text-sm text-gray-600">{result.swimmer}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{result.time}</div>
                      <div className="text-xs">
                        {result.index && (
                          <span className="text-success font-medium">{result.index.toFixed(3)}</span>
                        )}
                        {result.status && (
                          <span className={`ml-1 ${
                            result.status === 'QT' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {result.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relay Events Results */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Relay Events</h3>
            <div className="space-y-3">
              {results.relay.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{result.relay}</div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{result.totalTime}</div>
                      <div className="text-xs text-green-600">Projected Time</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {result.swimmers.map((swimmer, swimmerIndex) => (
                      <div key={swimmerIndex} className="text-gray-600">
                        {swimmer.stroke ? `${swimmer.stroke}: ` : `${swimmerIndex + 1}. `}
                        {swimmer.name} ({swimmer.time})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between items-center">
          <Button 
            variant="outline"
            onClick={onBackToEventAssignment} // Fixed: Now properly navigates back to event assignment step
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back to Event Assignment
          </Button>
          <Button onClick={handleExport} className="bg-primary-500 hover:bg-primary-600 text-white">
            <i className="fas fa-file-export mr-2"></i>Export Team Sheet
          </Button>
        </div>

        {/* Swimmer Load Summary */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Swimmer Event Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Calculate swimmer summaries from results */}
            {(() => {
              const swimmerSummary = new Map<string, { individual: string[], relay: number }>();
              
              results.individual.forEach(result => {
                if (!swimmerSummary.has(result.swimmer)) {
                  swimmerSummary.set(result.swimmer, { individual: [], relay: 0 });
                }
                swimmerSummary.get(result.swimmer)!.individual.push(result.event);
              });
              
              results.relay.forEach(result => {
                result.swimmers.forEach(swimmer => {
                  if (!swimmerSummary.has(swimmer.name)) {
                    swimmerSummary.set(swimmer.name, { individual: [], relay: 0 });
                  }
                  swimmerSummary.get(swimmer.name)!.relay++;
                });
              });
              
              return Array.from(swimmerSummary.entries()).map(([name, summary]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-gray-900">{name}</div>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      {summary.individual.length} event{summary.individual.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{summary.individual.join(', ')}</div>
                    {summary.relay > 0 && (
                      <div className="text-xs text-gray-500 mt-1">Plus {summary.relay} relay leg{summary.relay !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
