export interface Listing {
  id: number;
  title: string;
  artist: string;
  price_clp: number;
  city: string;
  genre: string;
  status: string;
  description?: string;
  created_at?: string;
  label?: string;
  subgenre?: string;
  year?: number;
  condition_media?: string;
  condition_sleeve?: string;
  seller_id?: number;
  seller_name?: string;
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
  listing_id?: number;
  listing_title?: string;
  other_user_name?: string;
  last_message?: string;
  unread_count?: number;
  updated_at?: string;
}

export interface MessageCreate {
  listing_id: number;
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
