export const OUTLETS = [
  { id: 'Bandra', name: 'Bandra', city: 'Mumbai' },
  { id: 'Kala-Ghoda', name: 'Kala Ghoda', city: 'Mumbai' },
  { id: 'Powai', name: 'Powai', city: 'Mumbai' },
  { id: 'Malad', name: 'Malad', city: 'Mumbai' },
  { id: 'Breach-Candy', name: 'Breach Candy', city: 'Mumbai' },
  { id: 'Kalina', name: 'Kalina', city: 'Mumbai' },
];

export const CHANNELS = [
  { id: 'dispatchimages', name: 'Dispatch', color: '#378ADD', slackId: 'C0ANJLFQB2B' },
  { id: 'wastage', name: 'Wastage', color: '#D85A30', slackId: 'C0AQ8471SJ3' },
  { id: 'deepcleaning', name: 'Deep Cleaning', color: '#7F77DD', slackId: 'C0APD1HGLSV' },
  { id: 'outletchecklists', name: 'Checklists', color: '#EF9F27', slackId: 'C0ANJLR9ZK9' },
  { id: 'naitems', name: 'NA Items', color: '#E24B4A', slackId: 'C0APUCTP12L' },
];

export const USER_MAP = {
  'U0APMQ87FRC': 'Powai',
  'U0AQCH54Q3D': 'Malad',
  'U0AQNCB6PPW': 'Bandra',
  'U0AQ30DK1FT': 'Kala-Ghoda',
  'U0AQ3BXTYMD': 'Breach-Candy',
  'U0AQENN2N78': 'Kalina',
};

// Reverse lookup: outlet id → slack user id. Used to build B2 key prefixes,
// since the bucket organises images by uploader's Slack user ID, not outlet name.
export const OUTLET_TO_USER = Object.fromEntries(
  Object.entries(USER_MAP).map(([uid, outlet]) => [outlet, uid])
);

export const B2_PUBLIC_URL = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET || 'flax-ops-images'}`;
