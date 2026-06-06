/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt: string;
  language?: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
}

export interface CustomerProfile {
  userId: string;
  clientName: string;
  businessName: string;
  contactNumber: string;
  emailAddress: string;
  businessAddress: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
  status: 'captured' | 'failed';
  orderId: string;
  userId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  clientName: string;
  businessName: string;
  emailAddress: string;
  contactNumber: string;
  amount: number;
  gstAmount: number;
  netAmount: number;
  productName: string;
  licenseKey: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'purchase' | 'payment_success' | 'license_activated' | 'new_version' | 'invoice_generated' | 'security';
  read: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  version: string;
  size: string;
  price: number;
  originalPrice?: number;
  features: string[];
  description: string;
  downloadUrl: string;
  createdAt: string;
  connectedPlan?: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  amount: number;
  couponCode?: string;
  status: 'pending' | 'success' | 'failed';
  paymentId?: string;
  createdAt: string;
}

export interface License {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  productId: string;
  productName: string;
  licenseKey: string;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

export interface DownloadInfo {
  id: string;
  version: string;
  filename: string;
  fileSize: string;
  downloadUrl: string;
  releaseNotes: string[];
  downloadCount: number;
  createdAt: string;
}

export interface TicketReply {
  id: string;
  authorName: string;
  authorRole: 'admin' | 'customer';
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  category: 'License Issue' | 'Billing & Invoice' | 'Technical Bug' | 'Feature Request' | 'Other';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  replies: TicketReply[];
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
  expiresBy: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  text: string;
  rating: number;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string;
  date: string;
  readTime: string;
}

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  thumbnail: string;
  description: string;
  createdAt?: string;
}

export interface SystemStats {
  totalRevenue: number;
  totalCustomers: number;
  totalOrders: number;
  activeLicenses: number;
  totalDownloads: number;
  openTickets: number;
}
