/**
 * Domain types mirroring the Django REST API serializers.
 *
 * Conventions:
 * - Every model is scoped to an account server-side; `account` is never sent by
 *   the client (the backend stamps it), so it is absent from these types.
 * - DRF renders `DecimalField` as a JSON string, so money/reading amounts are
 *   typed as `string` here, not `number`.
 * - Foreign keys are serialized as their numeric id (PrimaryKeyRelatedField).
 * - Fields the serializer marks `read_only` are still returned on reads; the
 *   `*Input` payload types below omit them so writes stay type-safe.
 */

// ---------------------------------------------------------------------------
// Enums / choice literals (values match the Django TextChoices exactly)
// ---------------------------------------------------------------------------

export type Role = 'admin' | 'manager' | 'accountant' | 'security';

export type AccountStatus = 'active' | 'inactive';
export type BuildingStatus = 'active' | 'inactive';
export type RecordStatus = 'active' | 'inactive';
export type OccupancyStatus = 'vacant' | 'occupied';
export type BillStatus = 'draft' | 'issued' | 'paid';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved';
export type ComplaintPriority = 'emergency' | 'urgent' | 'routine';
export type StaffStatus = 'active' | 'inactive';

// ---------------------------------------------------------------------------
// Auth & account
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Account {
  id: number;
  name: string;
  slug: string;
}

/** POST /api/auth/login/ and /register/ return a token pair. */
export interface TokenPair {
  access: string;
  refresh: string;
}

/**
 * POST /api/auth/register/ response. When email verification is enabled the
 * backend omits the tokens and returns a `detail` message (the user must then
 * verify their email); when it's disabled the backend returns a full token
 * pair and the user is signed straight in.
 */
export interface RegisterResponse {
  user: User;
  account: Pick<Account, 'id' | 'name'>;
  detail?: string;
  access?: string;
  refresh?: string;
}

/** GET /api/search/?q= — global record search result. */
export type SearchResultType = 'flat' | 'resident' | 'bill' | 'complaint' | 'visitor';

export interface SearchResult {
  type: SearchResultType;
  id: number;
  title: string;
  subtitle: string;
}

/** GET /api/auth/me/ response. */
export interface MeResponse {
  user: User;
  account: Account | null;
  role: Role | null;
  email_verified: boolean;
  full_name: string;
  phone: string;
}

/** PATCH /api/auth/me/ — the user editing their own profile. */
export interface ProfileUpdateInput {
  full_name?: string;
  phone?: string;
  email?: string;
}

/** POST /api/auth/change-password/. */
export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

/** GET/PATCH /api/account/ — the society/account settings. */
export interface AccountDetails {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status: AccountStatus;
  slug: string;
}

export type AccountUpdateInput = Pick<
  AccountDetails,
  'name' | 'contact_person' | 'phone' | 'email' | 'address'
>;

/** POST /api/auth/verify-email/ — a valid 6-digit code returns a token pair. */
export interface VerifyEmailInput {
  email: string;
  code: string;
}

/** POST /api/auth/reset-password/ — OTP-based password reset. */
export interface ResetPasswordInput {
  email: string;
  code: string;
  new_password: string;
  new_password_confirm: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  account_name?: string;
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export interface Building {
  id: number;
  name: string;
  address: string;
  city: string;
  total_floors: number;
  status: BuildingStatus;
  created_at: string;
  updated_at: string;
}

export type BuildingInput = Omit<Building, 'id' | 'created_at' | 'updated_at'>;

export interface ApartmentType {
  id: number;
  name: string;
  maintenance_charge: string;
  status: BuildingStatus;
  created_at: string;
  updated_at: string;
}

export type ApartmentTypeInput = Omit<ApartmentType, 'id' | 'created_at' | 'updated_at'>;

export interface Flat {
  id: number;
  building: number;
  owner: number | null;
  apartment_type: number | null;
  /** Read-only: the apartment type's name, resolved server-side. */
  apartment_type_name?: string;
  flat_number: string;
  floor_number: number;
  flat_type: string;
  occupancy_status: OccupancyStatus;
  created_at: string;
  updated_at: string;
}

// building is optional: multi-building is off, so the API defaults it to the
// account's single building when omitted. apartment_type_name is read-only.
export type FlatInput = Omit<
  Flat,
  'id' | 'created_at' | 'updated_at' | 'building' | 'apartment_type_name'
> & {
  building?: number;
};

/** Payload for POST /api/flats/bulk_create/ — one flat per number in `flat_numbers`. */
export interface BulkFlatsInput {
  building?: number;
  apartment_type?: number | null;
  flat_type?: string;
  floor_number?: number;
  occupancy_status?: OccupancyStatus;
  flat_numbers: string[];
}

/** Result of a bulk flat create: how many were made, and which numbers were skipped. */
export interface BulkFlatsResult {
  created: number;
  skipped: string[];
}

// ---------------------------------------------------------------------------
// Residents
// ---------------------------------------------------------------------------

export interface Person {
  id: number;
  full_name: string;
  cnic: string;
  phone: string;
  email: string;
  permanent_address: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  created_at: string;
  updated_at: string;
}

export type PersonInput = Omit<Person, 'id' | 'created_at' | 'updated_at'>;

export interface Owner {
  id: number;
  person: number;
  owner_type: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export type OwnerInput = Omit<Owner, 'id' | 'created_at' | 'updated_at'>;

export interface Occupant {
  id: number;
  person: number;
  flat: number;
  occupancy_type: string;
  move_in_date: string | null;
  move_out_date: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export type OccupantInput = Omit<Occupant, 'id' | 'created_at' | 'updated_at'>;

export interface Vehicle {
  id: number;
  person: number | null;
  visitor: number | null;
  vehicle_type: string;
  registration_number: string;
  color: string;
  parking_slot_number: string;
  created_at: string;
  updated_at: string;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

export type InspectionKind = 'move_in' | 'move_out';

export interface Inspection {
  id: number;
  flat: number;
  occupant: number | null;
  kind: InspectionKind;
  inspection_date: string;
  notes: string;
  created_at: string;
}

export type InspectionInput = Omit<Inspection, 'id' | 'created_at'>;

export type DepositStatus = 'held' | 'settled' | 'refunded';

export interface SecurityDeposit {
  id: number;
  flat: number;
  occupant: number | null;
  amount: string;
  status: DepositStatus;
  held_date: string | null;
  settled_date: string | null;
  deductions: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** Create/patch payload — all fields optional so a settle can PATCH a subset. */
export type SecurityDepositInput = Partial<Omit<SecurityDeposit, 'id' | 'created_at' | 'updated_at'>>;

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export interface Visitor {
  id: number;
  flat: number;
  visitor_name: string;
  contact_number: string;
  cnic: string;
  host_name: string;
  entry_time: string | null;
  exit_time: string | null;
  created_at: string;
  updated_at: string;
}

export type VisitorInput = Omit<Visitor, 'id' | 'created_at' | 'updated_at'>;

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export interface Meter {
  id: number;
  flat: number;
  meter_number: string;
  unit_rate: string;
  previous_reading: string;
  current_reading: string;
  created_at: string;
  updated_at: string;
}

export type MeterInput = Omit<Meter, 'id' | 'created_at' | 'updated_at'>;

export interface MeterReading {
  id: number;
  meter: number;
  reading_date: string;
  reading_value: string;
  notes: string;
  created_at: string;
}

export type MeterReadingInput = Omit<MeterReading, 'id' | 'created_at'>;

export interface ElectricityRate {
  id: number;
  building: number;
  rate: string;
  effective_from: string;
  created_at: string;
}

// building optional: defaults to the account's single building (multi-building off).
export type ElectricityRateInput = Omit<ElectricityRate, 'id' | 'created_at' | 'building'> & {
  building?: number;
};

export interface MaintenanceRate {
  id: number;
  building: number;
  amount: string;
  effective_from: string;
  created_at: string;
}

export type MaintenanceRateInput = Omit<MaintenanceRate, 'id' | 'created_at' | 'building'> & {
  building?: number;
};

export interface ElectricityBill {
  id: number;
  flat: number;
  meter: number;
  billing_period_start: string;
  billing_period_end: string;
  previous_reading: string;
  current_reading: string | null;
  units_consumed: string;
  unit_rate: string;
  electricity_charge: string;
  maintenance_charge: string;
  previous_outstanding: string;
  total_payable: string;
  status: BillStatus;
  issued_at: string | null;
  paid_at: string | null;
  pdf_path: string;
  created_at: string;
  updated_at: string;
}

/**
 * Writable fields for an electricity bill. The reading, derived amounts, and
 * lifecycle fields are read-only server-side (set by the enter_reading action /
 * calculation service).
 */
export type ElectricityBillInput = Pick<
  ElectricityBill,
  'flat' | 'meter' | 'billing_period_start' | 'billing_period_end' | 'previous_reading' | 'previous_outstanding'
>;

/** Payload for POST /api/electricity-bills/{id}/enter_reading/. */
export interface EnterReadingInput {
  current_reading: string;
  reading_date: string;
  notes?: string;
}

export interface MaintenanceCharge {
  id: number;
  flat: number;
  billing_period: string;
  current_month_charge: string;
  previous_outstanding: string;
  total_due: string;
  status: BillStatus;
  issued_at: string | null;
  paid_at: string | null;
  pdf_path: string;
  created_at: string;
  updated_at: string;
}

export type MaintenanceChargeInput = Pick<
  MaintenanceCharge,
  'flat' | 'billing_period' | 'current_month_charge' | 'previous_outstanding'
>;

export interface Payment {
  id: number;
  electricity_bill: number | null;
  maintenance_charge: number | null;
  payment_date: string;
  amount: string;
  payment_method: string;
  reference_number: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentInput = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: number;
  full_name: string;
  cnic: string;
  phone: string;
  emergency_contact: string;
  designation: string;
  joining_date: string | null;
  salary: string;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
}

export type StaffMemberInput = Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>;

export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: number;
  staff_member: number;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
  notes: string;
  created_at: string;
}

export type AttendanceRecordInput = Omit<AttendanceRecord, 'id' | 'created_at'>;

export interface SalaryPayment {
  id: number;
  staff_member: number;
  payment_date: string;
  amount: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

export type SalaryPaymentInput = Omit<SalaryPayment, 'id' | 'created_at'>;

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

export interface Complaint {
  id: number;
  flat: number;
  complaint_type: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_staff: number | null;
  reported_at: string;
  resolved_at: string | null;
  resolution_note: string;
  resolution_cost: string | null;
  created_at: string;
  updated_at: string;
  /** Attached documents — only present on the detail (retrieve) response. */
  documents?: AppDocument[];
}

/** Writable fields; status defaults to "open" and resolved_at is derived server-side. */
export interface ComplaintInput {
  flat: number;
  complaint_type: string;
  description: string;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  assigned_staff?: number | null;
  resolution_note?: string;
  resolution_cost?: string | null;
}

// ---------------------------------------------------------------------------
// Documents (Supabase-backed uploads, mediated by Django)
// ---------------------------------------------------------------------------

/** Entities a document can attach to (matches the backend DOCUMENT_TARGETS keys). */
export type DocumentTarget =
  | 'person'
  | 'owner'
  | 'occupant'
  | 'expense'
  | 'staff_member'
  | 'complaint'
  | 'electricity_bill'
  | 'inspection';

/** Named `AppDocument` to avoid clashing with the DOM `Document` type. */
export interface AppDocument {
  id: number;
  related_model: DocumentTarget;
  related_id: number;
  document_type: string;
  file_name: string;
  content_type: string;
  size: number;
  uploaded_by: number | null;
  uploaded_at: string;
  /** API endpoint that streams the file (requires auth). */
  download_url: string;
}

/** Multipart upload payload for POST /api/documents/. */
export interface DocumentUploadInput {
  file: File;
  related_model: DocumentTarget;
  related_id: number;
  document_type?: string;
}
