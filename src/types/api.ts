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

/** POST /api/auth/register/ response. */
export interface RegisterResponse extends TokenPair {
  user: User;
  account: Pick<Account, 'id' | 'name'>;
}

/** GET /api/auth/me/ response. */
export interface MeResponse {
  user: User;
  account: Account | null;
  role: Role | null;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
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

export interface Flat {
  id: number;
  building: number;
  owner: number | null;
  flat_number: string;
  floor_number: number;
  flat_type: string;
  occupancy_status: OccupancyStatus;
  created_at: string;
  updated_at: string;
}

export type FlatInput = Omit<Flat, 'id' | 'created_at' | 'updated_at'>;

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

export type ElectricityRateInput = Omit<ElectricityRate, 'id' | 'created_at'>;

export interface MaintenanceRate {
  id: number;
  building: number;
  amount: string;
  effective_from: string;
  created_at: string;
}

export type MaintenanceRateInput = Omit<MaintenanceRate, 'id' | 'created_at'>;

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
