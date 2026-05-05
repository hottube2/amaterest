export type PremiumProductCategory =
  | "pantry"
  | "under_sink"
  | "entryway"
  | "closet"
  | "vanity_bathroom"
  | "beauty_high_ticket";

export type PremiumProduct = {
  productKey: string;
  category: PremiumProductCategory;
  brand: string;
  productName: string;
  amazonUrl: string;
  priceBand: "mid" | "high" | "premium";
  visualHook: string;
  commissionPriority: number;
  evergreenScore: number;
  aestheticScore: number;
  problemSolutionScore: number;
  highTicket: boolean;
  notes: string;
};

export const premiumProducts: PremiumProduct[] = [
  {
    productKey: "pantry_oxo_pop_5pc_01",
    category: "pantry",
    brand: "OXO",
    productName: "POP Airtight Pantry Container Set",
    amazonUrl: "https://www.amazon.ca/dp/B077VH4JRK",
    priceBand: "high",
    visualHook: "uniform clear containers",
    commissionPriority: 78,
    evergreenScore: 87,
    aestheticScore: 90,
    problemSolutionScore: 80,
    highTicket: false,
    notes: "Kitchen staple, very visual."
  },
  {
    productKey: "pantry_oxo_steel_6pc_01",
    category: "pantry",
    brand: "OXO",
    productName: "Steel POP Container Set",
    amazonUrl: "https://www.amazon.ca/dp/B08ZK5WDWN",
    priceBand: "high",
    visualHook: "brushed steel pantry reset",
    commissionPriority: 74,
    evergreenScore: 84,
    aestheticScore: 88,
    problemSolutionScore: 78,
    highTicket: false,
    notes: "Premium pantry storage angle."
  },
  {
    productKey: "pantry_rubbermaid_brilliance_10pc_01",
    category: "pantry",
    brand: "Rubbermaid",
    productName: "Brilliance Pantry Container Set 10-Piece",
    amazonUrl: "https://www.amazon.ca/dp/B08D9S4V8C",
    priceBand: "mid",
    visualHook: "clear stackable pantry bins",
    commissionPriority: 72,
    evergreenScore: 86,
    aestheticScore: 82,
    problemSolutionScore: 84,
    highTicket: false,
    notes: "Broad, practical pantry organizer."
  },
  {
    productKey: "pantry_rubbermaid_brilliance_20pc_01",
    category: "pantry",
    brand: "Rubbermaid",
    productName: "Brilliance Food Storage Set 20-Piece",
    amazonUrl: "https://www.amazon.ca/dp/B0752V1XJX",
    priceBand: "mid",
    visualHook: "matching containers for a full shelf reset",
    commissionPriority: 76,
    evergreenScore: 86,
    aestheticScore: 80,
    problemSolutionScore: 86,
    highTicket: false,
    notes: "Good value bundle for pantry and fridge organization."
  },
  {
    productKey: "pantry_progressive_prokeeper_6pc_01",
    category: "pantry",
    brand: "Progressive",
    productName: "ProKeeper Pantry Storage Set",
    amazonUrl: "https://www.amazon.ca/dp/B0758BZKQN",
    priceBand: "high",
    visualHook: "ingredient stations with clean labels",
    commissionPriority: 73,
    evergreenScore: 82,
    aestheticScore: 84,
    problemSolutionScore: 81,
    highTicket: false,
    notes: "Strong baking pantry use case."
  },
  {
    productKey: "pantry_vtopmart_24pc_01",
    category: "pantry",
    brand: "Vtopmart",
    productName: "Airtight Pantry Containers 24-Piece",
    amazonUrl: "https://www.amazon.ca/dp/B08KXKVT4K",
    priceBand: "mid",
    visualHook: "bulk pantry decanting transformation",
    commissionPriority: 70,
    evergreenScore: 88,
    aestheticScore: 79,
    problemSolutionScore: 85,
    highTicket: false,
    notes: "High-volume starter kit for pantry before/after pins."
  },
  {
    productKey: "under_sink_yamazaki_pullout_01",
    category: "under_sink",
    brand: "Yamazaki",
    productName: "Under-Sink Pull-Out Organizer",
    amazonUrl: "https://www.amazon.ca/dp/B0BZCMRNB9",
    priceBand: "high",
    visualHook: "sliding access under the sink",
    commissionPriority: 82,
    evergreenScore: 88,
    aestheticScore: 86,
    problemSolutionScore: 91,
    highTicket: true,
    notes: "Premium under-sink problem solver."
  },
  {
    productKey: "under_sink_yamazaki_pan_pot_01",
    category: "under_sink",
    brand: "Yamazaki",
    productName: "Pan and Pot Lid Organizer",
    amazonUrl: "https://www.amazon.ca/dp/B0C1X4PGK4",
    priceBand: "high",
    visualHook: "vertical cookware and lid reset",
    commissionPriority: 77,
    evergreenScore: 83,
    aestheticScore: 82,
    problemSolutionScore: 88,
    highTicket: false,
    notes: "Works for lower cabinet and under-sink adjacent content."
  },
  {
    productKey: "under_sink_delamu_clear_2tier_01",
    category: "under_sink",
    brand: "Delamu",
    productName: "Clear 2-Tier Under-Sink Organizer",
    amazonUrl: "https://www.amazon.ca/dp/B0B2NWJ5W2",
    priceBand: "mid",
    visualHook: "two-tier clear storage gain",
    commissionPriority: 73,
    evergreenScore: 87,
    aestheticScore: 76,
    problemSolutionScore: 90,
    highTicket: false,
    notes: "Simple before/after cleanup angle."
  },
  {
    productKey: "under_sink_delamu_clear_4pc_01",
    category: "under_sink",
    brand: "Delamu",
    productName: "Clear Under-Sink Organizer 4-Pack",
    amazonUrl: "https://www.amazon.ca/dp/B0C7QVK1Y7",
    priceBand: "mid",
    visualHook: "matching bins for every bottle",
    commissionPriority: 72,
    evergreenScore: 84,
    aestheticScore: 78,
    problemSolutionScore: 87,
    highTicket: false,
    notes: "Bundle angle for bathroom and kitchen sink cabinets."
  },
  {
    productKey: "under_sink_iris_drawer_2pack_01",
    category: "under_sink",
    brand: "IRIS",
    productName: "Stackable Under-Sink Drawer Organizer 2-Pack",
    amazonUrl: "https://www.amazon.ca/dp/B00CQGTIE0",
    priceBand: "mid",
    visualHook: "stackable drawer pull-outs",
    commissionPriority: 69,
    evergreenScore: 82,
    aestheticScore: 72,
    problemSolutionScore: 86,
    highTicket: false,
    notes: "Practical drawer solution for tight sink cabinets."
  },
  {
    productKey: "under_sink_iris_drawer_3pack_01",
    category: "under_sink",
    brand: "IRIS",
    productName: "Stackable Under-Sink Drawer Organizer 3-Pack",
    amazonUrl: "https://www.amazon.ca/dp/B07JGWT25L",
    priceBand: "mid",
    visualHook: "three-drawer cabinet reset",
    commissionPriority: 70,
    evergreenScore: 82,
    aestheticScore: 72,
    problemSolutionScore: 87,
    highTicket: false,
    notes: "Good multi-cabinet utility buy."
  },
  {
    productKey: "entryway_songmics_bamboo_bench_01",
    category: "entryway",
    brand: "SONGMICS",
    productName: "Bamboo Shoe Bench",
    amazonUrl: "https://www.amazon.ca/dp/B08L4RYJYG",
    priceBand: "high",
    visualHook: "entryway drop zone upgrade",
    commissionPriority: 80,
    evergreenScore: 88,
    aestheticScore: 84,
    problemSolutionScore: 83,
    highTicket: true,
    notes: "Strong entryway before/after pin."
  },
  {
    productKey: "entryway_songmics_storage_bench_01",
    category: "entryway",
    brand: "SONGMICS",
    productName: "Shoe Storage Bench",
    amazonUrl: "https://www.amazon.ca/dp/B01N125MU5",
    priceBand: "high",
    visualHook: "hidden shoe clutter storage",
    commissionPriority: 78,
    evergreenScore: 86,
    aestheticScore: 82,
    problemSolutionScore: 85,
    highTicket: true,
    notes: "Useful for clutter-to-clean entryway content."
  },
  {
    productKey: "entryway_songmics_modern_bench_01",
    category: "entryway",
    brand: "SONGMICS",
    productName: "Modern Entryway Shoe Bench",
    amazonUrl: "https://www.amazon.ca/dp/B0CNGTZ3B5",
    priceBand: "high",
    visualHook: "modern hallway landing zone",
    commissionPriority: 76,
    evergreenScore: 84,
    aestheticScore: 86,
    problemSolutionScore: 80,
    highTicket: true,
    notes: "More decor-forward entryway angle."
  },
  {
    productKey: "vanity_cq_acrylic_3pack_01",
    category: "vanity_bathroom",
    brand: "CQ Acrylic",
    productName: "Acrylic Vanity Organizer 3-Pack",
    amazonUrl: "https://www.amazon.ca/dp/B01M6Y9L6N",
    priceBand: "mid",
    visualHook: "clear acrylic vanity reset",
    commissionPriority: 72,
    evergreenScore: 82,
    aestheticScore: 90,
    problemSolutionScore: 75,
    highTicket: false,
    notes: "Clean makeup and skincare organization."
  },
  {
    productKey: "vanity_bino_5drawer_01",
    category: "vanity_bathroom",
    brand: "BINO",
    productName: "5-Drawer Vanity Organizer",
    amazonUrl: "https://www.amazon.ca/dp/B01BHF2W1A",
    priceBand: "mid",
    visualHook: "small drawers for daily beauty clutter",
    commissionPriority: 71,
    evergreenScore: 80,
    aestheticScore: 87,
    problemSolutionScore: 78,
    highTicket: false,
    notes: "Good compact vanity problem/solution."
  },
  {
    productKey: "beauty_shark_flexstyle_hd430c_01",
    category: "beauty_high_ticket",
    brand: "Shark",
    productName: "FlexStyle Air Styling System HD430C",
    amazonUrl: "https://www.amazon.ca/dp/B0BN4V8R7S",
    priceBand: "premium",
    visualHook: "salon-style hair routine at home",
    commissionPriority: 92,
    evergreenScore: 86,
    aestheticScore: 91,
    problemSolutionScore: 79,
    highTicket: true,
    notes: "High-ticket beauty winner candidate."
  },
  {
    productKey: "closet_closetmaid_starter_kit_01",
    category: "closet",
    brand: "ClosetMaid",
    productName: "ClosetMaid Starter Closet Kit",
    amazonUrl: "https://www.amazon.com/",
    priceBand: "high",
    visualHook: "starter closet rail and shelf reset",
    commissionPriority: 4,
    evergreenScore: 4,
    aestheticScore: 4,
    problemSolutionScore: 4,
    highTicket: false,
    notes: "Backlog: excluded until affiliate URL and stock are reliable."
  },
  {
    productKey: "closet_closetmaid_organizer_kit_01",
    category: "closet",
    brand: "ClosetMaid",
    productName: "ClosetMaid Organizer Kit",
    amazonUrl: "https://www.amazon.com/",
    priceBand: "high",
    visualHook: "modular closet shelf transformation",
    commissionPriority: 4,
    evergreenScore: 4,
    aestheticScore: 4,
    problemSolutionScore: 4,
    highTicket: false,
    notes: "Backlog: excluded until affiliate URL and stock are reliable."
  },
  {
    productKey: "closet_closetmaid_tower_drawers_01",
    category: "closet",
    brand: "ClosetMaid",
    productName: "ClosetMaid Tower with Drawers",
    amazonUrl: "https://www.amazon.com/",
    priceBand: "high",
    visualHook: "tall modular closet tower with drawer stack",
    commissionPriority: 4,
    evergreenScore: 4,
    aestheticScore: 4,
    problemSolutionScore: 4,
    highTicket: true,
    notes: "Backlog: excluded until affiliate URL and stock are reliable."
  }
];
