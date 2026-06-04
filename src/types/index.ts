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
  | "cancelled";

export interface Order {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  listing_price_clp: number;
  shipping_price_clp?: number | null;
  status: OrderStatus | string;
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
