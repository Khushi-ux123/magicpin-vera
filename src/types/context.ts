// Domain context + trigger types.
// Note: Zod is optional in this repo. We keep this file dependency-free to
// avoid npm peer-dependency conflicts during the challenge.

export type OfferCatalog = {
  title: string;
  value?: string;
  audience?: string;
};

export type Voice = {
  tone?: string;
  vocab_allowed?: string[];
  vocab_taboo?: string[];
};

export type CategoryContext = {
  slug: string;
  offer_catalog?: OfferCatalog[];
  voice?: Voice;
  peer_stats?: {
    avg_rating?: number;
    avg_reviews?: number;
    avg_ctr?: number;
    scope?: string;
  };
  digest?: Array<{
    id?: string;
    kind?: string;
    title?: string;
    source?: string;
    trial_n?: number;
    patient_segment?: string;
    summary?: string;
  }>;
  patient_content_library?: Array<{
    id?: string;
    title?: string;
    channel?: string;
    body?: string;
  }>;
  seasonal_beats?: Array<{
    month_range?: string;
    note?: string;
  }>;
  trend_signals?: Array<{
    query?: string;
    delta_yoy?: number;
    segment_age?: string;
  }>;
};

export type MerchantIdentity = {
  name: string;
  city?: string;
  locality?: string;
  place_id?: string;
  verified?: boolean;
  languages?: string[];
  owner_first_name?: string;
};

export type MerchantPerformance = {
  window_days?: number;
  views?: number;
  calls?: number;
  directions?: number;
  ctr?: number;
  delta_7d?: {
    views_pct?: number;
    calls_pct?: number;
  };
};

export type MerchantOffer = {
  id?: string;
  title?: string;
  status?: 'active' | 'expired' | 'paused' | 'draft' | string;
};

export type MerchantContext = {
  merchant_id: string;
  category_slug?: string;
  identity: MerchantIdentity;
  subscription?: {
    status?: string;
    plan?: string;
    days_remaining?: number;
  };
  performance?: MerchantPerformance;
  offers?: MerchantOffer[];
  conversation_history?: Array<any>;
  customer_aggregate?: Record<string, any>;
  signals?: string[];
};

export type CustomerIdentity = {
  name?: string;
  phone_redacted?: string;
  language_pref?: string;
};

export type CustomerRelationship = {
  first_visit?: string;
  last_visit?: string;
  visits_total?: number;
  services_received?: string[];
};

export type CustomerContext = {
  customer_id: string;
  merchant_id?: string;
  identity: CustomerIdentity;
  relationship?: CustomerRelationship;
  state?: string;
  preferences?: {
    preferred_slots?: string;
    channel?: string;
  };
  consent?: {
    opted_in_at?: string;
    scope?: string[];
  };
};

export type TriggerPayload = Record<string, any>;

export type TriggerContext = {
  id: string;
  scope?: 'merchant' | 'customer';
  kind: string;
  source?: string;
  merchant_id?: string;
  customer_id?: string | null;
  payload?: TriggerPayload;
  urgency?: number;
  suppression_key?: string;
  expires_at?: string;
};

