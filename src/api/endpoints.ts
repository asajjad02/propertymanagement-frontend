/**
 * Concrete API resources, one per DRF viewset. Import these (or the hooks in
 * src/hooks) rather than calling `apiClient` directly, so paths and types stay
 * in one place.
 */
import { apiClient } from '@/lib/api-client';
import type {
  ApartmentType,
  ApartmentTypeInput,
  BillTemplate,
  BillTemplateInput,
  BillingRound,
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
 * POST /electricity-bills/{id}/enter_reading/ — records the reading + meter
 * photo and issues the bill.
 *
 * Multipart, not JSON: the photo is required and commits in the same transaction
 * as the reading, so the endpoint takes only form data. The api-client drops the
 * JSON Content-Type for FormData so the browser sets the multipart boundary, and
 * the Document row is created server-side — no separate upload call.
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

/** GET /billing/rounds/{month}/ — the month's stops and progress in one request. */
export async function fetchBillingRound(month: string): Promise<BillingRound> {
  const { data } = await apiClient.get<BillingRound>(`/billing/rounds/${month}/`);
  return data;
}

/** POST /billing/rounds/ — create the month's draft bills (defaults to current month). */
export async function createBillingRound(month?: string): Promise<BillingRound> {
  const { data } = await apiClient.post<BillingRound>('/billing/rounds/', month ? { month } : {});
  return data;
}

/** GET /billing/template/ — the account's bill-presentation template. */
export async function fetchBillTemplate(): Promise<BillTemplate> {
  const { data } = await apiClient.get<BillTemplate>('/billing/template/');
  return data;
}

/** PATCH /billing/template/ — update the account's bill template (admin only). */
export async function updateBillTemplate(input: BillTemplateInput): Promise<BillTemplate> {
  const { data } = await apiClient.patch<BillTemplate>('/billing/template/', input);
  return data;
}

/** GET /billing/template/preview-data/ — sample tokens merged with the saved branding, for the browser-rendered preview. */
export async function fetchBillTemplatePreviewData(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<Record<string, string>>('/billing/template/preview-data/');
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

/** GET /electricity-bills/{id}/bill_data/ — display-ready tokens for the browser-rendered branded bill. */
export async function fetchBillTokens(id: number): Promise<Record<string, string>> {
  const { data } = await apiClient.get<Record<string, string>>(
    `${electricityBills.path}${id}/bill_data/`,
  );
  return data;
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

/**
 * POST /meters/opening_readings/ — set many meters' starting figures at once.
 *
 * One atomic request rather than a PATCH per flat: a half-applied set would
 * leave some flats billing from zero with no way to tell which. Meters that
 * already have an issued bill come back in `skipped` rather than being
 * overwritten — that reading is the anchor their bill was built on.
 */
export async function setOpeningReadings(
  readings: { meter: number; current_reading: string }[],
): Promise<{ updated: number; skipped: { meter: number; flat_number: string; reason: string }[] }> {
  const { data } = await apiClient.post('/meters/opening_readings/', { readings });
  return data;
}

/**
 * GET /billing/rounds/{month}/pdf/ — the month's issued bills as one PDF, a page
 * each, in flat-number order. Drafts are excluded server-side: a draft has no
 * amounts, so its page would be a blank statement.
 */
export async function downloadRoundPdf(month: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/billing/rounds/${month}/pdf/`, {
    responseType: 'blob',
  });
  return data;
}


/**
 * GET /electricity-bills/outstanding/ — money owed, aggregated in the database.
 *
 * The Overview used to sum this in the browser from every bill ever raised.
 */
export async function fetchOutstanding(): Promise<{ amount: string; bill_count: number }> {
  const { data } = await apiClient.get<{ amount: string; bill_count: number }>(
    `${electricityBills.path}outstanding/`,
  );
  return data;
}
