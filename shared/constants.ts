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
    // Individual events - 11U (50m strokes only)
    { event: '50m Freestyle', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Freestyle', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Backstroke', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Backstroke', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Breaststroke', ageCategory: 11, gender: 'Female', isRelay: false },
    { event: '50m Butterfly', ageCategory: 11, gender: 'Male', isRelay: false },
    { event: '50m Butterfly', ageCategory: 11, gender: 'Female', isRelay: false },
    
    // Individual events - 13U (100m strokes only)
    { event: '100m Freestyle', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 13, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 13, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 13, gender: 'Female', isRelay: false },
    
    // Individual events - 15U (100m strokes only)
    { event: '100m Freestyle', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 15, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 15, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 15, gender: 'Female', isRelay: false },
    
    // Individual events - Open (100m strokes + 200m IM)
    { event: '100m Freestyle', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Freestyle', ageCategory: 99, gender: 'Female', isRelay: false },
    { event: '100m Backstroke', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Backstroke', ageCategory: 99, gender: 'Female', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Breaststroke', ageCategory: 99, gender: 'Female', isRelay: false },
    { event: '100m Butterfly', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '100m Butterfly', ageCategory: 99, gender: 'Female', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 99, gender: 'Male', isRelay: false },
    { event: '200m Individual Medley', ageCategory: 99, gender: 'Female', isRelay: false },
    
    // Relay events - 11U
    { event: '4x50m Freestyle', ageCategory: 11, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 11, gender: 'Female', isRelay: true },
    { event: '4x50m Medley', ageCategory: 11, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 11, gender: 'Female', isRelay: true },
    
    // Relay events - 13U
    { event: '4x50m Freestyle', ageCategory: 13, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 13, gender: 'Female', isRelay: true },
    { event: '4x50m Medley', ageCategory: 13, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 13, gender: 'Female', isRelay: true },
    
    // Relay events - 15U
    { event: '4x50m Freestyle', ageCategory: 15, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 15, gender: 'Female', isRelay: true },
    { event: '4x50m Medley', ageCategory: 15, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 15, gender: 'Female', isRelay: true },
    
    // Relay events - Open
    { event: '4x50m Freestyle', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4x50m Freestyle', ageCategory: 99, gender: 'Female', isRelay: true },
    { event: '4x50m Medley', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4x50m Medley', ageCategory: 99, gender: 'Female', isRelay: true },
    
    // Squadrun - Mixed age/gender relay (8 swimmers: M/F from 11U, 13U, 15U, Open)
    { event: 'Squadrun', ageCategory: 998, gender: 'Mixed', isRelay: true },
  ]
};

// County Relays configuration
export const COUNTY_RELAYS_CONFIG = {
  name: 'County Relays',
  maxIndividualEvents: 0, // No individual events
  events: [
    // 4x50m Freestyle relays
    { event: '4 x 50m Freestyle', ageCategory: 12, gender: 'Male', isRelay: true },
    { event: '4 x 50m Freestyle', ageCategory: 12, gender: 'Female', isRelay: true },
    { event: '4 x 50m Freestyle', ageCategory: 14, gender: 'Male', isRelay: true },
    { event: '4 x 50m Freestyle', ageCategory: 14, gender: 'Female', isRelay: true },
    { event: '4 x 50m Freestyle', ageCategory: 16, gender: 'Male', isRelay: true },
    { event: '4 x 50m Freestyle', ageCategory: 16, gender: 'Female', isRelay: true },

    // 4x100m Freestyle relays - Open age group
    { event: '4 x 100m Freestyle', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4 x 100m Freestyle', ageCategory: 99, gender: 'Female', isRelay: true },

    // 4x200m Freestyle relays - Open age group
    { event: '4 x 200m Freestyle', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4 x 200m Freestyle', ageCategory: 99, gender: 'Female', isRelay: true },

    // 4x50m Medley relays
    { event: '4 x 50m Medley', ageCategory: 12, gender: 'Male', isRelay: true },
    { event: '4 x 50m Medley', ageCategory: 12, gender: 'Female', isRelay: true },
    { event: '4 x 50m Medley', ageCategory: 14, gender: 'Male', isRelay: true },
    { event: '4 x 50m Medley', ageCategory: 14, gender: 'Female', isRelay: true },
    { event: '4 x 50m Medley', ageCategory: 16, gender: 'Male', isRelay: true },
    { event: '4 x 50m Medley', ageCategory: 16, gender: 'Female', isRelay: true },

    // 4x100m Medley relays - Open age group
    { event: '4 x 100m Medley', ageCategory: 99, gender: 'Male', isRelay: true },
    { event: '4 x 100m Medley', ageCategory: 99, gender: 'Female', isRelay: true },
  ]
};

// Custom Competition configuration
export const CUSTOM_COMPETITION_CONFIG = {
  name: 'Custom Competition',
  maxIndividualEvents: null, // User-defined
  events: [], // Will be populated by user selection
};

// Available event types for custom event builder
export const INDIVIDUAL_EVENT_TYPES = [
  '50m Freestyle',
  '100m Freestyle', 
  '200m Freestyle',
  '50m Backstroke',
  '100m Backstroke',
  '200m Backstroke', 
  '50m Breaststroke',
  '100m Breaststroke',
  '200m Breaststroke',
  '50m Butterfly',
  '100m Butterfly',
  '200m Butterfly',
  '100m Individual Medley',
  '200m Individual Medley'
];

export const RELAY_TYPES = [
  'Freestyle',
  'Medley'
];

export const RELAY_DISTANCES = [50, 100, 200];

export const CUSTOM_AGE_GROUPS = [
  { value: 10, label: '10 & Under' },
  { value: 11, label: '11 & Under' },
  { value: 12, label: '12 & Under' },
  { value: 13, label: '13 & Under' },
  { value: 14, label: '14 & Under' },
  { value: 15, label: '15 & Under' },
  { value: 16, label: '16 & Under' },
  { value: 99, label: 'Open' }
];

export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Both', label: 'Both (creates 2 events)' }
];

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

// Helper function to get event list for a competition type
export function getEventListForCompetition(competitionType: CompetitionType) {
  switch (competitionType) {
    case COMPETITION_TYPES.ARENA_LEAGUE:
      return ARENA_LEAGUE_CONFIG.events;
    case COMPETITION_TYPES.COUNTY_RELAYS:
      return COUNTY_RELAYS_CONFIG.events;
    case COMPETITION_TYPES.CUSTOM:
      return CUSTOM_COMPETITION_CONFIG.events;
    default:
      return ARENA_LEAGUE_CONFIG.events;
  }
}

// Helper function to get max individual events for a competition type
export function getMaxIndividualEventsForCompetition(competitionType: CompetitionType) {
  switch (competitionType) {
    case COMPETITION_TYPES.ARENA_LEAGUE:
      return ARENA_LEAGUE_CONFIG.maxIndividualEvents;
    case COMPETITION_TYPES.COUNTY_RELAYS:
      return COUNTY_RELAYS_CONFIG.maxIndividualEvents;
    case COMPETITION_TYPES.CUSTOM:
      return CUSTOM_COMPETITION_CONFIG.maxIndividualEvents;
    default:
      return ARENA_LEAGUE_CONFIG.maxIndividualEvents;
  }
}