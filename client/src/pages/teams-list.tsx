import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, Trophy, Settings } from "lucide-react";
import type { Team } from "@shared/schema";
import { getCompetitionTypeDisplay, getAgeCategoryDisplay } from "@shared/constants";

export default function TeamsListPage() {
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading teams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Swimming Teams</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your swimming team competitions and assignments
              </p>
            </div>
            <Link href="/create-team">
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No teams yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first swimming team
            </p>
            <Link href="/create-team">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-900 dark:text-white truncate">
                      {team.name}
                    </CardTitle>
                    <Badge 
                      variant={team.isComplete ? "default" : "secondary"}
                      className="ml-2 flex-shrink-0"
                    >
                      {team.isComplete ? "Complete" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Trophy className="mr-2 h-4 w-4" />
                      {getCompetitionTypeDisplay(team.competitionType as any)}
                    </div>
                    
                    {team.maxIndividualEvents && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Users className="mr-2 h-4 w-4" />
                        Max {team.maxIndividualEvents} events per swimmer
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(team.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/team/${team.id}/workflow`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        {team.isComplete ? "Edit" : "Continue"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}