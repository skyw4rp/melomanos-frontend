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

export interface MessageCreate {
  listing_id: number;
  message_text: string;
}
