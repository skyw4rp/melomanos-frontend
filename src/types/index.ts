export interface Listing {
  id: number;
  title: string;
  artist: string;
  price_clp: number;
  city: string;
  genre: string;
  status?: string;
  description?: string;
  created_at?: string;
  label?: string;
  subgenre?: string;
  year?: number;
  condition_media?: string;
  condition_sleeve?: string;
  record_condition?: string;
  cover_condition?: string;
  listing_type?: string;
  video_url?: string | null;
  /** Seller user id when embedded seller profile is not included */
  seller_id?: number;
  /** Seller display name when returned by GET /listings/{id} */
  seller_name?: string;
  /** Seller city when returned by the API; otherwise use listing.city */
  seller_city?: string;
}

export interface ListingsResponse {
  total: number;
  items: Listing[];
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  full_name?: string;
  city?: string;
}

export type SubscriptionPlanType = "free" | "pack" | "pro";

export interface SubscriptionStatus {
  plan_type: SubscriptionPlanType;
  active_listings: number;
  listing_limit: number | null;
  remaining_slots: number | null;
}

export interface SellerReputation {
  user_id: number;
  average_rating: number | null;
  total_reviews: number;
  completed_sales: number;
  protected_trades: number;
  disputed_orders: number;
  trust_level: string;
  badges?: string[];
}

export interface DiggingScoreBreakdown {
  completed_sales: number;
  completed_purchases: number;
  reviews_received: number;
  reviews_written: number;
  active_listings: number;
  protected_trades: number;
  disputes: number;
}

export interface DiggingScore {
  user_id: number;
  score: number;
  level: string;
  breakdown: DiggingScoreBreakdown;
}

export interface Conversation {
  id: number;
  listing_id: number;
  listing_title?: string;
  other_user_id?: number;
  other_user_name?: string;
  listing_seller_id?: number;
  /** @deprecated use listing_seller_id */
  seller_id?: number;
  /** @deprecated use last_message_text */
  last_message?: string;
  last_message_text?: string;
  last_message_at?: string;
  unread_count?: number;
  updated_at?: string;
}

export interface Message {
  id: number;
  listing_id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  is_read?: boolean;
  read?: boolean;
  is_deleted?: boolean;
  created_at?: string;
}

export interface FavoriteWithListing {
  id: number;
  user_id?: number;
  listing_id: number;
  created_at?: string;
  listing?: Partial<Listing> | null;
}

export interface MessageCreate {
  listing_id: number;
  message_text: string;
}

export interface MessageReplyCreate {
  listing_id: number;
  receiver_id: number;
  message_text: string;
}

export type OrderStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "pending_shipping"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "held" | "released" | "refunded";

export interface Order {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  listing_price_clp: number;
  shipping_price_clp?: number | null;
  status: OrderStatus | string;
  payment_status?: PaymentStatus | string;
  amount_paid_clp?: number | null;
  platform_fee_clp?: number | null;
  seller_amount_clp?: number | null;
  funds_held_at?: string | null;
  funds_released_at?: string | null;
  refunded_at?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipping_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  listing_title?: string;
  listing_artist?: string;
}

export interface OrderShippingUpdate {
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_notes?: string;
  shipping_price_clp?: number | null;
}

export interface ReviewCreate {
  listing_id: number;
  rating: number;
  comment?: string | null;
}

export interface Review {
  id: number;
  listing_id: number;
  seller_id: number;
  reviewer_id: number;
  rating: number;
  comment?: string | null;
  created_at?: string;
  reviewer_name?: string;
}

export interface SellerShippingProfile {
  origin_city: string | null;
  dispatch_time_hours: number | null;
  preferred_couriers: string[];
  shipping_notes: string | null;
}

export interface SellerShippingProfileUpdate {
  origin_city?: string | null;
  dispatch_time_hours?: number | null;
  preferred_couriers?: string[];
  shipping_notes?: string | null;
}

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_buyer"
  | "resolved_seller";

export type DisputeEvidenceType = "photo" | "video";

export interface OrderDispute {
  id: number;
  order_id: number;
  opened_by_user_id: number;
  reason: string;
  status: DisputeStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface DisputeEvidence {
  id: number;
  dispute_id: number;
  uploaded_by_user_id: number;
  file_url: string;
  evidence_type: DisputeEvidenceType | string;
  comment?: string | null;
  created_at?: string;
}

export interface DisputeEvidenceCreate {
  file_url: string;
  evidence_type: DisputeEvidenceType;
  comment?: string | null;
}

export interface DisputeResolution {
  dispute: OrderDispute;
  order_status: string;
  payment_status: string;
}

export interface ListingCreate {
  title: string;
  artist: string;
  label?: string;
  genre?: string;
  subgenre?: string;
  year?: number;
  condition_media?: string;
  condition_sleeve?: string;
  record_condition?: string;
  cover_condition?: string;
  listing_type?: string;
  video_url?: string | null;
  price_clp: number;
  description?: string;
  city: string;
}
