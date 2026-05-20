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

export interface ListingCreate {
  title: string;
  artist: string;
  label?: string;
  genre?: string;
  subgenre?: string;
  year?: number;
  condition_media?: string;
  condition_sleeve?: string;
  price_clp: number;
  description?: string;
  city: string;
}
