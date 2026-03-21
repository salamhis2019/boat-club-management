// Database types matching our Supabase schema

export type UserRole = 'admin' | 'member' | 'sub_user'
export type MembershipType = 'monthly' | 'annual'
export type ReservationStatus = 'active' | 'cancelled'
export type ChargeType = 'gas' | 'misc'
export type ChargeStatus = 'pending' | 'paid' | 'failed'
export type DocumentType = 'waiver' | 'drivers_license'

export interface User {
  id: string
  email: string
  role: UserRole
  parent_user_id: string | null
  first_name: string
  last_name: string
  phone_number: string
  membership_type: MembershipType
  membership_active: boolean
  documents_approved: boolean
  stripe_customer_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Boat {
  id: string
  name: string
  image_url: string | null
  description: string | null
  capacity: number
  horsepower: string | null
  features: string[]
  supported_activities: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id: string
  name: string
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  user_id: string
  boat_id: string
  date: string
  time_slot_id: string
  status: ReservationStatus
  created_by: string
  cancelled_at: string | null
  created_at: string
}

export interface BlockedDate {
  id: string
  boat_id: string
  date: string
  reason: string | null
  created_by: string
  created_at: string
}

export interface Charge {
  id: string
  user_id: string
  reservation_id: string | null
  amount: number
  type: ChargeType
  description: string
  status: ChargeStatus
  stripe_payment_intent_id: string | null
  retry_count: number
  created_by: string
  created_at: string
  paid_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  type: MembershipType
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  type: DocumentType
  file_url: string
  uploaded_at: string
  approved: boolean
  approved_by: string | null
  approved_at: string | null
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, unknown>
  created_at: string
}

// Extended types with relations
export interface ReservationWithDetails extends Reservation {
  boat: Boat
  time_slot: TimeSlot
  user: User
}

export interface ChargeWithDetails extends Charge {
  user: User
  reservation: Reservation | null
}

export interface DocumentWithUser extends Document {
  user: User
}

export interface UserWithSubUsers extends User {
  sub_users: User[]
}
