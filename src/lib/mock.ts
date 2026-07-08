// Mock data for the admin panel UI demo.
export type BookingStatus =
  | "DRAFT" | "CONFIRMED" | "DRIVER_ASSIGNED" | "DRIVER_ARRIVING"
  | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "COMPLETED" | "CANCELLED";

export type VehicleType = "BIKE" | "THREE_WHEELER" | "TATA_ACE" | "MINI_TRUCK";

export const bookings = Array.from({ length: 42 }).map((_, i) => {
  const statuses: BookingStatus[] = [
    "CONFIRMED", "DRIVER_ASSIGNED", "IN_TRANSIT", "COMPLETED",
    "COMPLETED", "PICKED_UP", "CANCELLED", "CONFIRMED",
  ];
  const vts: VehicleType[] = ["BIKE", "THREE_WHEELER", "TATA_ACE", "MINI_TRUCK"];
  const customers = [
    "Aarav Sharma", "Priya Patel", "Rohan Iyer", "Neha Reddy",
    "Vikram Singh", "Ananya Das", "Karan Mehta", "Ishita Roy",
  ];
  const drivers = [
    "Suresh K.", "Manoj T.", "Ravi P.", "Imran S.",
    "Ajay V.", "Mohit R.", null, "Deepak G.",
  ];
  const addresses = [
    "Bandra Kurla Complex, Mumbai", "Sector 22, Gurgaon",
    "MG Road, Bengaluru", "Salt Lake, Kolkata",
    "Banjara Hills, Hyderabad", "Anna Nagar, Chennai",
    "Koramangala, Bengaluru", "Connaught Place, Delhi",
  ];
  const status = statuses[i % statuses.length];
  const fare = 240 + ((i * 137) % 4200);
  return {
    id: `bk_${i + 1}`,
    bookingNumber: `BK20260611${String(100000 + i).slice(-6)}`,
    customer: customers[i % customers.length],
    customerPhone: `+91 9${String(800000000 + i * 13).slice(0, 9)}`,
    driver: status === "CONFIRMED" ? null : drivers[i % drivers.length],
    vehicleType: vts[i % vts.length],
    pickupAddress: addresses[i % addresses.length],
    dropAddress: addresses[(i + 3) % addresses.length],
    fare,
    paymentStatus: (["PAID", "PENDING", "PAID", "FAILED"] as const)[i % 4],
    status,
    createdMinAgo: 3 + i * 7,
  };
});

export const drivers = Array.from({ length: 28 }).map((_, i) => {
  const names = [
    "Suresh Kumar", "Manoj Tiwari", "Ravi Pawar", "Imran Sheikh",
    "Ajay Verma", "Mohit Rana", "Deepak Goyal", "Sandeep Yadav",
    "Naveen R.", "Faisal A.", "Pranav K.", "Rakesh M.",
  ];
  const statuses = ["AVAILABLE", "ON_TRIP", "OFFLINE", "BREAK"] as const;
  const verif = ["VERIFIED", "PENDING", "MANUAL_REVIEW", "VERIFIED", "FAILED"] as const;
  const plans = ["BASIC", "STANDARD", "PRO", "PREMIUM"] as const;
  return {
    id: `dr_${i + 1}`,
    name: names[i % names.length],
    phone: `+91 9${String(700000000 + i * 17).slice(0, 9)}`,
    licenseNumber: `MH${10 + i}-202600${1000 + i}`,
    status: statuses[i % 4],
    docVerified: i % 5 !== 0,
    dlVerifStatus: verif[i % verif.length],
    rcVerifStatus: verif[(i + 1) % verif.length],
    plan: plans[i % 4],
    rating: 4.2 + ((i * 7) % 8) / 10,
    totalTrips: 12 + i * 27,
    vehicleReg: `MH-12-AB-${1000 + i}`,
    isActive: i % 9 !== 0,
    daysWaiting: i % 7,
  };
});

export const fleetOwners = Array.from({ length: 14 }).map((_, i) => ({
  id: `fo_${i + 1}`,
  companyName: ["Bharat Logistics", "Speedex Carriers", "Reliable Movers",
    "Express Cargo", "Apex Freight", "Coastal Transport", "Metro Haulers"][i % 7] + ` Pvt Ltd`,
  owner: ["Rajesh Khanna", "Anil Kapoor", "Sunil Shetty", "Madhuri B.",
    "Vikas Joshi", "Pooja Hegde", "Ramesh Gupta"][i % 7],
  gstin: `27AAEPM${String(1234 + i)}A1Z${i % 10}`,
  trucks: 3 + (i * 2) % 18,
  drivers: 4 + (i * 3) % 22,
  verified: i % 4 !== 0,
  earningsMTD: 120000 + i * 38000,
  active: i % 8 !== 0,
}));

export const fleetTrucks = Array.from({ length: 24 }).map((_, i) => {
  const docStatuses = ["VALID", "EXPIRING", "EXPIRED"] as const;
  return {
    id: `ft_${i + 1}`,
    registrationNo: `MH-${12 + (i % 30)}-CD-${4000 + i}`,
    type: (["TATA_ACE", "MINI_TRUCK", "THREE_WHEELER"] as VehicleType[])[i % 3],
    fleetOwner: fleetOwners[i % fleetOwners.length].companyName,
    currentDriver: i % 3 === 0 ? null : `Driver ${i + 1}`,
    insurance: docStatuses[i % 3],
    fitness: docStatuses[(i + 1) % 3],
    puc: docStatuses[(i + 2) % 3],
    permit: docStatuses[i % 3],
    insuranceExpiry: `2026-${String(((i % 12) + 1)).padStart(2, "0")}-15`,
  };
});

export const tickets = Array.from({ length: 18 }).map((_, i) => ({
  id: `tk_${i + 1}`,
  ticketNo: `T-${5000 + i}`,
  subject: [
    "Driver was rude during pickup",
    "Refund request for booking BK20260610100023",
    "Payment failed but amount deducted",
    "Vehicle did not match what was booked",
    "Lost parcel during transit",
    "Wrong fare calculation",
  ][i % 6],
  user: ["Aarav Sharma", "Priya P.", "Rohan I.", "Neha R."][i % 4],
  userRole: (["CUSTOMER", "DRIVER", "CUSTOMER", "FLEET_OWNER"] as const)[i % 4],
  status: (["OPEN", "IN_PROGRESS", "RESOLVED", "OPEN", "IN_PROGRESS"] as const)[i % 5],
  openedMinAgo: 12 + i * 53,
  lastReplyMinAgo: 5 + i * 11,
  slaBreached: i % 7 === 0,
}));

export const subscriptions = Array.from({ length: 16 }).map((_, i) => ({
  id: `sub_${i + 1}`,
  driver: drivers[i % drivers.length].name,
  plan: drivers[i % drivers.length].plan,
  pricePerMonth: [299, 499, 799, 1299][i % 4],
  startDate: "2026-05-15",
  endDate: `2026-${String((i % 6) + 6).padStart(2, "0")}-${String(10 + (i % 18)).padStart(2, "0")}`,
  isActive: i % 6 !== 0,
}));

export const vehicleTypes = [
  { type: "BIKE", displayName: "Bike", baseFare: 30, pricePerKm: 8, minFare: 30, capacityKg: 50, eta: 5, active: true },
  { type: "THREE_WHEELER", displayName: "3-Wheeler", baseFare: 80, pricePerKm: 15, minFare: 80, capacityKg: 300, eta: 8, active: true },
  { type: "TATA_ACE", displayName: "Tata Ace", baseFare: 150, pricePerKm: 25, minFare: 150, capacityKg: 750, eta: 12, active: true },
  { type: "MINI_TRUCK", displayName: "Mini Truck", baseFare: 300, pricePerKm: 40, minFare: 300, capacityKg: 1500, eta: 20, active: true },
];

export const announcements = [
  { id: "a1", title: "Diwali Bonus Week", body: "Earn 2x coins on every booking this week.", active: true, startsAt: "2026-06-10", endsAt: "2026-06-17", hasImage: true },
  { id: "a2", title: "App Maintenance — 2 AM IST", body: "Brief downtime for upgrades on June 14.", active: true, startsAt: "2026-06-13", endsAt: "2026-06-14", hasImage: false },
  { id: "a3", title: "New Driver Subscription Plans", body: "Updated tiers with better commissions.", active: false, startsAt: "2026-05-01", endsAt: "2026-05-31", hasImage: true },
];

export const ulipLogs = Array.from({ length: 22 }).map((_, i) => ({
  id: `log_${i + 1}`,
  entityType: i % 2 === 0 ? "driver" : "vehicle",
  entityId: `${i % 2 === 0 ? "dr" : "ve"}_${i + 1}`,
  api: i % 2 === 0 ? "AUTHAPI/03 (SARATHI)" : "AUTHAPI/02 (VAHAN)",
  status: (["VERIFIED", "FAILED", "MANUAL_REVIEW", "VERIFIED"] as const)[i % 4],
  calledAt: `2026-06-${String((i % 11) + 1).padStart(2, "0")} 14:${String(i * 3 % 60).padStart(2, "0")}`,
  calledBy: ["system", "admin@parther.com", "ops@parther.com"][i % 3],
}));

export const revenueTrend = Array.from({ length: 30 }).map((_, i) => ({
  day: `D${i + 1}`,
  revenue: 45000 + Math.round(Math.sin(i / 3) * 12000) + i * 1200,
  bookings: 28 + Math.round(Math.cos(i / 4) * 10) + i,
}));

export const bookingStatusDist = [
  { name: "Completed", value: 312, color: "var(--color-chart-3)" },
  { name: "In Transit", value: 84, color: "var(--color-chart-2)" },
  { name: "Confirmed", value: 47, color: "var(--color-chart-1)" },
  { name: "Cancelled", value: 23, color: "var(--color-chart-4)" },
];

export const planDist = [
  { plan: "BASIC", drivers: 124 },
  { plan: "STANDARD", drivers: 87 },
  { plan: "PRO", drivers: 53 },
  { plan: "PREMIUM", drivers: 21 },
];

export const vehicleDemand = [
  { type: "BIKE", count: 412 },
  { type: "3-Wheeler", count: 287 },
  { type: "Tata Ace", count: 196 },
  { type: "Mini Truck", count: 88 },
];

export const customers = Array.from({ length: 24 }).map((_, i) => ({
  id: `u_${i + 1}`,
  name: ["Aarav Sharma", "Priya Patel", "Rohan Iyer", "Neha Reddy",
    "Vikram Singh", "Ananya Das", "Karan Mehta", "Ishita Roy",
    "Aditya Joshi", "Sneha Kapoor", "Rahul Nair", "Megha Bose"][i % 12],
  phone: `+91 9${String(600000000 + i * 19).slice(0, 9)}`,
  email: i % 3 === 0 ? `user${i}@parther.com` : null,
  usageType: i % 4 === 0 ? "Business" : "Personal",
  profileComplete: i % 6 !== 0,
  wallet: 100 + i * 87,
  coins: 50 + i * 23,
  bookings: 1 + i * 3,
  active: i % 11 !== 0,
}));

export const dispatchQueue = bookings.filter((b) => b.status === "CONFIRMED" && !b.driver).slice(0, 8);
