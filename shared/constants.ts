// Competition types
export const COMPETITION_TYPES = {
  ARENA_LEAGUE: 'arena_league',
  COUNTY_RELAYS: 'county_relays',
  CUSTOM: 'custom'
} as const;

export type CompetitionType = typeof COMPETITION_TYPES[keyof typeof COMPETITION_TYPES];

// Arena League configuration
export const ARENA_LEAGUE_CONFIG = {
  name: 'Arena League',
  maxIndividualEvents: 2,
  events: [
    // Individual events - current event list (keeping existing)
    { event: '50m Freestyle', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Freestyle', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '50m Freestyle', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '50m Freestyle', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '50m Freestyle', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '50m Freestyle', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '50m Freestyle', ageCategory: 99, gender: 'Male', isRelay: false }, // Open
    { event: '50m Freestyle', ageCategory: 99, gender: 'Female', isRelay: false },
    
    { event: '100m Freestyle', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '100m Freestyle', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '100m Freestyle', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Freestyle', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '100m Freestyle', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Freestyle', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '100m Freestyle', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '50m Backstroke', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '100m Backstroke', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '50m Breaststroke', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '100m Breaststroke', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '50m Butterfly', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '100m Butterfly', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 99, gender: 'Female', isRelay: false },

    { event: '200m Individual Medley', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 12, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 12, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 14, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 14, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 16, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 16, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 99, gender: 'Female', isRelay: false },
  ]
};

// County Relays configuration
export const COUNTY_RELAYS_CONFIG = {
  name: 'County Relays',
  maxIndividualEvents: null, // No individual events
  events: [
    // 4x50m Freestyle relays
    { event: '4x50m Freestyle', ageCategory: 12, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 12, gender: 'Female', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 14, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 14, gender: 'Female', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 16, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 16, gender: 'Female', isRelay: true },

    // 4x100m Freestyle relays - Open age group
    { event: '4x100m Freestyle', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4x100m Freestyle', ageCategory: 99, gender: 'Female', isRelay: true },

    // 4x200m Freestyle relays - Open age group
    { event: '4x200m Freestyle', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4x200m Freestyle', ageCategory: 99, gender: 'Female', isRelay: true },

    // 4x50m Medley relays
    { event: '4x50m Medley', ageCategory: 12, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 12, gender: 'Female', isRelay: true },
    { event: '4x50m Medley', ageCategory: 14, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 14, gender: 'Female', isRelay: true },
    { event: '4x50m Medley', ageCategory: 16, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 16, gender: 'Female', isRelay: true },

    // 4x100m Medley relays - Open age group
    { event: '4x100m Medley', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4x100m Medley', ageCategory: 99, gender: 'Female', isRelay: true },
  ]
};

// Available events for custom competitions
export const CUSTOM_EVENTS_POOL = {
  individual: [
    // 50m events for all strokes
    { event: '50m Freestyle', distances: [50], strokes: ['Freestyle'] },
    { event: '50m Backstroke', distances: [50], strokes: ['Backstroke'] },
    { event: '50m Breaststroke', distances: [50], strokes: ['Breaststroke'] },
    { event: '50m Butterfly', distances: [50], strokes: ['Butterfly'] },
    
    // 100m events for all strokes
    { event: '100m Freestyle', distances: [100], strokes: ['Freestyle'] },
    { event: '100m Backstroke', distances: [100], strokes: ['Backstroke'] },
    { event: '100m Breaststroke', distances: [100], strokes: ['Breaststroke'] },
    { event: '100m Butterfly', distances: [100], strokes: ['Butterfly'] },
    
    // 200m Individual Medley
    { event: '200m Individual Medley', distances: [200], strokes: ['Individual Medley'] },
  ],
  relay: [
    // 4x50m relays
    { event: '4x50m Freestyle', distances: [50], strokes: ['Freestyle'], ageGroups: [11, 12, 13, 14, 15, 16, 99] },
    { event: '4x50m Medley', distances: [50], strokes: ['Medley'], ageGroups: [11, 12, 13, 14, 15, 16, 99] },
    
    // 4x100m relays
    { event: '4x100m Freestyle', distances: [100], strokes: ['Freestyle'], ageGroups: [15, 16, 99] },
    { event: '4x100m Medley', distances: [100], strokes: ['Medley'], ageGroups: [15, 16, 99] },
  ]
};

export const AGE_GROUPS = [11, 12, 13, 14, 15, 16, 99]; // 99 represents "Open"
export const GENDERS = ['Male', 'Female'];
export const STROKES = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley', 'Medley'];
export const DISTANCES = [50, 100, 200];

// Helper function to get age category display name
export function getAgeCategoryDisplay(ageCategory: number): string {
  return ageCategory === 99 ? 'Open' : `${ageCategory} & Under`;
}

// Helper function to get competition type display name
export function getCompetitionTypeDisplay(type: CompetitionType): string {
  switch (type) {
    case COMPETITION_TYPES.ARENA_LEAGUE:
      return 'Arena League';
    case COMPETITION_TYPES.COUNTY_RELAYS:
      return 'County Relays';
    case COMPETITION_TYPES.CUSTOM:
      return 'Custom Competition';
    default:
      return type;
  }
}