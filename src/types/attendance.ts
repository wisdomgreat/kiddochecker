
import { AppRole } from "./events";

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  allergies?: string;
  medical_info?: string;
  special_instructions?: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  created_at: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  created_at: string;
}

export interface CareLog {
  id: string;
  event_type: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  child_id: string;
  class_id?: string;
  attendance_date: string;
  checked_in_at: string;
  checked_out_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  checked_in_method: string;
  checked_out_method?: string;
  checked_in_station?: string;
  checked_out_station?: string;
  signature_data?: string;
  health_fever: boolean;
  health_cough: boolean;
  special_instructions?: string;
  qr_token?: string;
  created_at: string;
  child?: Child;
  class?: Class;
  // Forensic Metadata
  device_metadata?: Record<string, any>;
  authorized_pickup_snapshot?: any[];
  manual_override_reason?: string;
  witness_id?: string;
  room_transitions?: any[];
  incidents?: Incident[];
  care_logs?: CareLog[];
}

export interface AttendanceSummary {
  total_checked_in: number;
  total_checked_out: number;
  active_sessions: number;
}
