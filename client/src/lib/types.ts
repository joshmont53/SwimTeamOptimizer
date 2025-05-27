export interface SwimmerWithTimes {
  swimmer: {
    id: number;
    firstName: string;
    lastName: string;
    asaNo: string;
    dateOfBirth: string;
    gender: string;
    age: number;
    isAvailable: boolean;
  };
  times: Array<{
    id: number;
    event: string;
    course: string;
    time: string;
    timeInSeconds: number;
    meet: string;
    date: string;
    countyQualify?: string;
  }>;
}

export interface OptimizationResult {
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
}

export interface EventOption {
  event: string;
  ageCategory: number;
  gender: string;
}

export interface RelayOption {
  relayName: string;
  ageCategory: number;
  gender: string;
}
