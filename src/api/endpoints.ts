/**
 * Concrete API resources, one per DRF viewset. Import these (or the hooks in
 * src/hooks) rather than calling `apiClient` directly, so paths and types stay
 * in one place.
 */
import { apiClient } from '@/lib/api-client';
import type {
  ApartmentType,
  ApartmentTypeInput,
  BulkFlatsInput,
  BulkFlatsResult,
  Building,
  BuildingInput,
  Complaint,
  ComplaintInput,
  ElectricityBill,
  ElectricityBillInput,
  ElectricityRate,
  ElectricityRateInput,
  EnterReadingInput,
  Flat,
  FlatInput,
  MaintenanceCharge,
  MaintenanceChargeInput,
  MaintenanceRate,
  MaintenanceRateInput,
  Meter,
  MeterInput,
  MeterReading,
  MeterReadingInput,
  Occupant,
  OccupantInput,
  Owner,
  OwnerInput,
  Payment,
  PaymentInput,
  Person,
  PersonInput,
  StaffMember,
  StaffMemberInput,
  AttendanceRecord,
  AttendanceRecordInput,
  SalaryPayment,
  SalaryPaymentInput,
  Vehicle,
  VehicleInput,
  Visitor,
  VisitorInput,
  Inspection,
  InspectionInput,
  SecurityDeposit,
  SecurityDepositInput,
  SearchResult,
} from '@/types/api';
import type { TeamMember, TeamMemberInput } from '@/types/team';
import type { DashboardSummary } from '@/types/dashboard';

import { createResource } from './resource';

// Properties
export const buildings = createResource<Building, BuildingInput>('buildings');
export const flats = createResource<Flat, FlatInput>('flats');
export const apartmentTypes = createResource<ApartmentType, ApartmentTypeInput>('apartment-types');

// Residents
export const people = createResource<Person, PersonInput>('people');
export const owners = createResource<Owner, OwnerInput>('owners');
export const occupants = createResource<Occupant, OccupantInput>('occupants');
export const vehicles = createResource<Vehicle, VehicleInput>('vehicles');
export const inspections = createResource<Inspection, InspectionInput>('inspections');
export const securityDeposits = createResource<SecurityDeposit, SecurityDepositInput>('security-deposits');

// Operations
export const visitors = createResource<Visitor, VisitorInput>('visitors');

// Staff
export const staffMembers = createResource<StaffMember, StaffMemberInput>('staff-members');
export const attendanceRecords = createResource<AttendanceRecord, AttendanceRecordInput>('attendance-records');
export const salaryPayments = createResource<SalaryPayment, SalaryPaymentInput>('salary-payments');

// Team (account memberships — admin only)
export const team = createResource<TeamMember, TeamMemberInput>('team');

// Complaints
export const complaints = createResource<Complaint, ComplaintInput>('complaints');

// Billing
export const meters = createResource<Meter, MeterInput>('meters');
export const meterReadings = createResource<MeterReading, MeterReadingInput>('meter-readings');
export const electricityRates = createResource<ElectricityRate, ElectricityRateInput>('electricity-rates');
export const maintenanceRates = createResource<MaintenanceRate, MaintenanceRateInput>('maintenance-rates');
export const electricityBills = createResource<ElectricityBill, ElectricityBillInput>('electricity-bills');
export const maintenanceCharges = createResource<MaintenanceCharge, MaintenanceChargeInput>('maintenance-charges');
export const payments = createResource<Payment, PaymentInput>('payments');

// ---------------------------------------------------------------------------
// Custom viewset actions (not plain CRUD)
// ---------------------------------------------------------------------------

/** POST /flats/bulk_create/ — creates one flat per number; returns counts + skipped duplicates. */
export async function bulkCreateFlats(payload: BulkFlatsInput): Promise<BulkFlatsResult> {
  const { data } = await apiClient.post<BulkFlatsResult>(
    `${flats.path}bulk_create/`,
    payload,
  );
  return data;
}

/**
 * POST /electricity-bills/{id}/enter_reading/ — records the reading and issues
 * the bill.
 *
 * Multipart, not JSON: the meter photo is required and commits in the same
 * transaction as the reading, so the endpoint takes only form data. The
 * Document row is created server-side — no separate upload call.
 */
export async function enterBillReading(id: number, payload: EnterReadingInput): Promise<ElectricityBill> {
  const form = new FormData();
  form.append('current_reading', payload.current_reading);
  form.append('reading_date', payload.reading_date);
  if (payload.notes) form.append('notes', payload.notes);
  form.append('photo', payload.photo);
  const { data } = await apiClient.post<ElectricityBill>(
    `${electricityBills.path}${id}/enter_reading/`,
    form,
  );
  return data;
}

/** GET /dashboard/summary/ — operational (non-financial) overview metrics. */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary/');
  return data;
}

/** GET /search/?q= — global record search across the account (role-scoped). */
export async function globalSearch(q: string): Promise<SearchResult[]> {
  const { data } = await apiClient.get<{ results: SearchResult[] }>('/search/', { params: { q } });
  return data.results;
}

/** GET /electricity-bills/{id}/pdf/ — the combined bill as a PDF blob (authed). */
export async function downloadBillPdf(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`${electricityBills.path}${id}/pdf/`, {
    responseType: 'blob',
  });
  return data;
}

/** POST /electricity-bills/{id}/send/ — deliver the bill on a channel (email live). */
export async function sendBill(id: number, payload: { channel: string; to?: string }): Promise<void> {
  await apiClient.post(`${electricityBills.path}${id}/send/`, payload);
}

/** POST /electricity-bills/{id}/mark_paid/. */
export async function markElectricityBillPaid(id: number): Promise<ElectricityBill> {
  const { data } = await apiClient.post<ElectricityBill>(
    `${electricityBills.path}${id}/mark_paid/`,
  );
  return data;
}

/** POST /maintenance-charges/{id}/mark_paid/. */
export async function markMaintenanceChargePaid(id: number): Promise<MaintenanceCharge> {
  const { data } = await apiClient.post<MaintenanceCharge>(
    `${maintenanceCharges.path}${id}/mark_paid/`,
  );
  return data;
}
