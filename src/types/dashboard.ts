/** GET /api/dashboard/summary/ — operational (non-financial) overview. */
export interface DashboardSummary {
  flats: { total: number; occupied: number; vacant: number; occupancy_rate: number };
  buildings: number;
  residents: number;
  complaints: { open: number; in_progress: number; resolved: number };
  visitors_inside: number;
  setup: { has_building: boolean; has_flats: boolean; has_rates: boolean; has_team: boolean };
}
