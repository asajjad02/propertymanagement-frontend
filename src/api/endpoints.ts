/**
 * Concrete API resources, one per DRF viewset. Import these (or the hooks in
 * src/hooks) rather than calling `apiClient` directly, so paths and types stay
 * in one place.
 */
import { apiClient } from '@/lib/api-client';
import type {
  Building,
  BuildingInput,
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
  Vehicle,
  VehicleInput,
  Visitor,
  VisitorInput,
} from '@/types/api';

import { createResource } from './resource';

// Properties
export const buildings = createResource<Building, BuildingInput>('buildings');
export const flats = createResource<Flat, FlatInput>('flats');

// Residents
export const people = createResource<Person, PersonInput>('people');
export const owners = createResource<Owner, OwnerInput>('owners');
export const occupants = createResource<Occupant, OccupantInput>('occupants');
export const vehicles = createResource<Vehicle, VehicleInput>('vehicles');

// Operations
export const visitors = createResource<Visitor, VisitorInput>('visitors');

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

/** POST /electricity-bills/{id}/enter_reading/ — records the reading and issues the bill. */
export async function enterBillReading(id: number, payload: EnterReadingInput): Promise<ElectricityBill> {
  const { data } = await apiClient.post<ElectricityBill>(
    `${electricityBills.path}${id}/enter_reading/`,
    payload,
  );
  return data;
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
