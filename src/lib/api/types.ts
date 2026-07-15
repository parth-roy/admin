// ─────────────────────────────────────────────────────────────────────────────
// Admin API Type Definitions — mirrors Prisma models returned by the backend
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'DRIVER' | 'FLEET_OWNER' | 'ADMIN';
export type DriverStatus = 'OFFLINE' | 'AVAILABLE' | 'ON_TRIP' | 'BREAK';
export type BookingStatus = 'DRAFT' | 'CONFIRMED' | 'DRIVER_ASSIGNED' | 'DRIVER_ARRIVING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type VehicleType = 'BIKE' | 'THREE_WHEELER' | 'TATA_ACE' | 'MINI_TRUCK';
export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PRO' | 'PREMIUM';
export type UlipVerifStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type WalletTransactionType = 'CREDIT' | 'DEBIT';
export type WalletTransactionReason = 'TOP_UP' | 'BOOKING_PAYMENT' | 'REFUND' | 'CASHBACK' | 'ADMIN_CREDIT';

// ── Paginated response wrapper ────────────────────────────────────────────────
export interface Paginated<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

// ── API Success wrapper ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  role: UserRole;
  profileImageUrl: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  activeBookings: number;
  driversOnline: number;
  pendingAssignment: number;
  openTickets: number;
  todayRevenue: number;
  todayBookings: number;
  newUsers: number;
  driverApplications: number;
}

export interface RevenueTrendPoint {
  day: string;
  revenue: number;
  bookings: number;
}

export interface DashboardAlerts {
  ulipManualReview: number;
  docsPending: number;
  fleetDocsExpiring: number;
  paymentFailures: number;
  subscriptionsExpiring: number;
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export interface BookingListItem {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  vehicleType: VehicleType;
  totalFare: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  customer: { id: string; name: string | null; phone: string };
  driver: { user: { name: string | null; phone: string } } | null;
  driverId: string | null;
}

export interface BookingStop {
  id: string;
  sequence: number;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface BookingDetail extends BookingListItem {
  stops: BookingStop[];
  cancellationReason: string | null;
  cancelledBy: string | null;
  earning: DriverEarning | null;
  pricingAuditLog?: any[];
  grandTotal?: number;
  gstAmount?: number;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export interface UserListItem {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  wallet: { cachedBalance: number } | null;
  coinBalance: { cachedBalance: number } | null;
  _count: { bookings: number };
}

export interface UserDetail extends UserListItem {
  driver: DriverDetail | null;
  fleetOwner: FleetOwnerDetail | null;
  supportTickets: SupportTicket[];
  bookings: BookingListItem[];
}

// ── Drivers ───────────────────────────────────────────────────────────────────
export interface DriverDocument {
  id: string;
  type: string;
  status: DocumentStatus;
  fileUrl: string | null;
  rejectedReason: string | null;
  verifiedAt: string | null;
}

export interface DriverSubscription {
  id: string;
  plan: SubscriptionPlan;
  endDate: string;
  isActive: boolean;
}

export interface DriverVehicle {
  id: string;
  registrationNo: string;
  type: VehicleType;
  rcVerifStatus: UlipVerifStatus;
}

export interface DriverListItem {
  id: string;
  userId: string;
  licenseNumber: string;
  status: DriverStatus;
  dlVerifStatus: UlipVerifStatus;
  isDocVerified: boolean;
  rating: number;
  totalTrips: number;
  createdAt: string;
  user: { id: string; name: string | null; phone: string; email: string | null; isActive: boolean };
  vehicle: DriverVehicle | null;
  subscription: DriverSubscription | null;
  documents: Pick<DriverDocument, 'id' | 'type' | 'status'>[];
  complianceScore?: number;
}

export interface DriverEarning {
  id: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  paidAt: string | null;
  createdAt: string;
  booking: { bookingNumber: string };
  driver?: { user: { name: string | null; phone: string } };
}

export interface VerificationLog {
  id: string;
  entityType: string;
  entityId: string;
  apiType: string;
  status: string;
  rawResponse: any;
  calledAt: string;
}

export interface DriverDetail extends DriverListItem {
  documents: DriverDocument[];
  earnings: DriverEarning[];
  verificationLogs: VerificationLog[];
}

// ── Fleet ─────────────────────────────────────────────────────────────────────
export interface FleetOwnerListItem {
  id: string;
  userId: string;
  companyName: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string | null; phone: string; email: string | null; isActive: boolean };
  wallet: { cachedBalance: number } | null;
  _count: { trucks: number; drivers: number };
  complianceScore?: number;
}

export interface FleetTruck {
  id: string;
  registrationNo: string;
  vehicleType: VehicleType;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  pucExpiry: string | null;
  permitExpiry: string | null;
  rcVerifStatus: UlipVerifStatus;
  fleetOwner: { companyName: string | null; user: { name: string | null } };
}

export interface FleetOwnerDetail extends FleetOwnerListItem {
  trucks: FleetTruck[];
}

// ── Finance ───────────────────────────────────────────────────────────────────
export interface RevenueOverview {
  totalRevenue: number;
  totalBookings: number;
  platformCommission: number;
  activeSubscriptions: number;
  totalRefunds: number;
}

export interface FleetEarning {
  id: string;
  amount: number;
  fleetNet: number;
  paidAt: string | null;
  createdAt: string;
  fleetOwner: { companyName: string | null };
  booking: { bookingNumber: string };
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  reason: WalletTransactionReason;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  wallet: { user: { name: string | null; phone: string } };
}

// ── Support ───────────────────────────────────────────────────────────────────
export interface SupportMessage {
  id: string;
  senderId: string;
  isAgent: boolean;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  user: { id: string; name: string | null; phone: string; role: UserRole };
  bookingId: string | null;
  messages: SupportMessage[];
}

// ── Platform ──────────────────────────────────────────────────────────────────
export interface VehicleTypePricing {
  id: string;
  vehicleType: VehicleType;
  displayName: string;
  baseFare: number;
  pricePerKm: number;
  minFare: number;
  capacityKg: number | null;
  capacityDesc: string | null;
  isActive: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

// ── Pagination Params ─────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface BookingsParams extends PaginationParams {
  status?: BookingStatus;
  vehicleType?: VehicleType;
  paymentStatus?: PaymentStatus;
  search?: string;
  unassigned?: boolean;
  from?: string;
  to?: string;
}

export interface UsersParams extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface DriversParams extends PaginationParams {
  status?: DriverStatus;
  dlVerifStatus?: UlipVerifStatus;
  rcVerifStatus?: UlipVerifStatus;
  isDocVerified?: boolean;
  plan?: SubscriptionPlan;
  search?: string;
}

export interface FleetParams extends PaginationParams {
  search?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface FinanceParams extends PaginationParams {
  from?: string;
  to?: string;
  driverId?: string;
  fleetId?: string;
  plan?: SubscriptionPlan;
  isActive?: boolean;
  reason?: WalletTransactionReason;
  userId?: string;
}

export interface TicketsParams extends PaginationParams {
  status?: SupportTicketStatus;
  search?: string;
}
export interface Withdrawal {
  id: string;
  driverId?: string;
  fleetId?: string;
  workerId?: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  razorpayPayoutId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  driver?: { user: { name: string; phone: string } };
  fleet?: { companyName: string; ownerName: string };
  worker?: { name: string; phone: string };
}
