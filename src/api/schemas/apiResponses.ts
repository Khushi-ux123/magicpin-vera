export type HealthzResponse = {
  status: 'ok';
  uptime_seconds: number;
  contexts_loaded: { category: number; merchant: number; customer: number; trigger: number };
};

