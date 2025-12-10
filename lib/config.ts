export const DEVICE_MODELS = {
  iPhone: [
    "5S", "SE (1st Gen)", "SE (2020)", "SE (3rd Gen)",
    "6", "6s", "7", "7 Plus", "8", "8 Plus",
    "X", "XR", "XS", "XS Max",
    "11", "11 Pro", "11 Pro Max",
    "12", "12 Mini", "12 Pro", "12 Pro Max",
    "13", "13 Mini", "13 Pro", "13 Pro Max",
    "14", "14 Plus", "14 Pro", "14 Pro Max",
    "15", "15 Plus", "15 Pro", "15 Pro Max",
    "16", "16 E", "16 Plus", "16 Pro", "16 Pro Max",
    "17", "17 Air", "17 Pro", "17 Pro Max"
  ],
  "Apple Watch": [
    "Series 1", "Series 2", "Series 3", "Series 4",
    "Series 5", "Series 6", "Series 7", "Series 8",
    "Series 9", "SE 1", "SE 2", "Ultra", "Ultra 2"
  ],
  MacBook: ["MacBook", "MacBook Air", "MacBook Pro"],
  iPad: ["iPad", "iPad Air", "iPad Mini", "iPad Pro"]
} as const;

export const DEVICE_ISSUES = {
  iPhone: [
    "Original Screen", "Premium Screen", "Touch & Glass",
    "Battery", "Charging Port", "Ear Speaker", "Loud Speaker",
    "Back Glass", "Face ID", "Logic Board", "Other"
  ],
  "Apple Watch": ["Screen", "Touch & Glass", "Battery", "Other"],
  MacBook: [
    "Screen", "Battery", "Keyboard", "Liquid Damage",
    "Not Powering On", "Other"
  ],
  iPad: ["Touch & Glass", "Screen", "Battery", "Charging Port", "Other"]
} as const;

export const DEVICE_TYPES = ["iPhone", "Apple Watch", "MacBook", "iPad"] as const;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "pickup_scheduled",
  "in_repair",
  "completed",
  "delivered",
  "cancelled"
] as const;

export const USER_ROLES = [
  "super_admin",
  "manager",
  "sales_executive",
  "technician"
] as const;

export const LEAD_SOURCES = [
  "LP-1",
  "LP-2",
  "LP-3",
  "Website",
  "Referral",
  "Walk-in",
  "Social Media",
  "Google Ads",
  "Other"
] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-blue-100", text: "text-blue-800" },
  contacted: { bg: "bg-yellow-100", text: "text-yellow-800" },
  qualified: { bg: "bg-purple-100", text: "text-purple-800" },
  pickup_scheduled: { bg: "bg-orange-100", text: "text-orange-800" },
  in_repair: { bg: "bg-cyan-100", text: "text-cyan-800" },
  completed: { bg: "bg-green-100", text: "text-green-800" },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" },
};

export type DeviceType = typeof DEVICE_TYPES[number];
export type LeadStatus = typeof LEAD_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];
