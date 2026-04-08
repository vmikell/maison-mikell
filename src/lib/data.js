export const TODAY = new Date().toISOString().slice(0, 10)

export const houseProfile = {
  id: 'victor-home',
  name: 'Victor Home',
  sizeSqFt: 1000,
  levels: 2,
  bedrooms: 2,
  bathrooms: 1.5,
  hvac: {
    system: 'Mini split heat pump',
    heads: 4,
  },
  reminderRules: {
    majorLeadDays: 30,
    standardLeadDays: 7,
  },
}

export const maintenanceTasks = [
  { id: 'bathroom-refresh', title: 'Clean full bathroom', area: 'Bathroom', category: 'Cleaning', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '30 min', season: 'All year', priority: 'Routine', notes: 'Toilet, sink, mirror, shower/tub, counters, and floor.', lastDone: '2026-03-29', major: false },
  { id: 'half-bath-refresh', title: 'Clean half bath / powder room', area: 'Half bath', category: 'Cleaning', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '15 min', season: 'All year', priority: 'Routine', notes: 'Toilet, sink, mirror, counters, and floor.', lastDone: '2026-03-30', major: false },
  { id: 'bedsheets', title: 'Wash bedding and remake beds', area: 'Bedrooms', category: 'Laundry', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '45 min', season: 'All year', priority: 'Routine', notes: 'Sheets, pillowcases, and duvet/comforter touch-up as needed.', lastDone: '2026-03-28', major: false },
  { id: 'vacuum-floors', title: 'Vacuum and spot mop floors', area: 'Whole home', category: 'Cleaning', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '45 min', season: 'All year', priority: 'Routine', notes: 'High-traffic areas first; include stairs if applicable.', lastDone: '2026-03-27', major: false },
  { id: 'kitchen-deep-reset', title: 'Deep clean kitchen surfaces and appliance fronts', area: 'Kitchen', category: 'Cleaning', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '40 min', season: 'All year', priority: 'Routine', notes: 'Counters, sink, backsplash, stovetop, microwave interior, fridge handles, cabinet fronts.', lastDone: '2026-03-26', major: false },
  { id: 'water-plants', title: 'Water the plants', area: 'Living spaces', category: 'Plant care', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '15 min', season: 'All year', priority: 'Routine', notes: 'Check soil moisture first and water houseplants that need it.', lastDone: '2026-03-28', major: false },
  { id: 'mini-split-filters', title: 'Clean mini split filters on all 4 heads', area: 'HVAC', category: 'Systems', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '35 min', season: 'All year', priority: 'Important', notes: 'Open covers, wash filters gently, fully dry, reinstall.', lastDone: '2026-03-01', major: false },
  { id: 'mini-split-head-wipe', title: 'Wipe mini split covers and check for dust/mildew', area: 'HVAC', category: 'Systems', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', season: 'All year', priority: 'Important', notes: 'Check louvers and nearby wall/ceiling for condensation issues.', lastDone: '2026-03-05', major: false },
  { id: 'drains-refresh', title: 'Refresh sink and shower drains', area: 'Kitchen + baths', category: 'Plumbing', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', season: 'All year', priority: 'Routine', notes: 'Clear hair/debris and flush drains; avoid harsh chemicals when possible.', lastDone: '2026-03-03', major: false },
  { id: 'detector-check', title: 'Test smoke / CO detectors', area: 'Safety', category: 'Safety', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '10 min', season: 'All year', priority: 'Critical', notes: 'Test alarms and note any battery warnings.', lastDone: '2026-03-02', major: false },
  { id: 'fridge-cleanout', title: 'Clean out fridge and check for expired food', area: 'Kitchen', category: 'Cleaning', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '25 min', season: 'All year', priority: 'Routine', notes: 'Wipe shelves and drawers while checking condiments/produce.', lastDone: '2026-03-08', major: false },
  { id: 'dryer-vent-lint', title: 'Deep clean lint trap area and dryer vent connection', area: 'Laundry', category: 'Safety', frequency: 'Quarterly', cadenceDays: 90, reminderLeadDays: 30, effort: '30 min', season: 'All year', priority: 'Critical', notes: 'Vacuum around lint trap cavity and inspect the vent hose.', lastDone: '2026-01-15', major: true },
  { id: 'under-sink-check', title: 'Inspect under sinks for leaks or moisture', area: 'Kitchen + baths', category: 'Plumbing', frequency: 'Quarterly', cadenceDays: 90, reminderLeadDays: 30, effort: '15 min', season: 'All year', priority: 'Important', notes: 'Check shutoffs, traps, and cabinet floors.', lastDone: '2026-01-10', major: true },
  { id: 'windows-screens', title: 'Clean interior windows and inspect screens', area: 'Whole home', category: 'Seasonal', frequency: 'Quarterly', cadenceDays: 90, reminderLeadDays: 30, effort: '60 min', season: 'Spring / Fall', priority: 'Routine', notes: 'Good spring reset task and useful before summer.', lastDone: '2025-12-20', major: true },
  { id: 'mini-split-pro', title: 'Professional mini split maintenance / coil cleaning', area: 'HVAC', category: 'Systems', frequency: 'Annual', cadenceDays: 365, reminderLeadDays: 30, effort: 'Schedule vendor', season: 'Spring', priority: 'Critical', notes: 'Have the 4-head heat pump system professionally serviced before peak cooling season.', lastDone: '2025-05-01', major: true },
  { id: 'water-shutoff-review', title: 'Review water shutoff locations and emergency supplies', area: 'Safety', category: 'Safety', frequency: 'Annual', cadenceDays: 365, reminderLeadDays: 30, effort: '20 min', season: 'Any', priority: 'Important', notes: 'Make sure both of you know where shutoffs, flashlight, and basic supplies are.', lastDone: '2025-06-10', major: true },
  { id: 'caulk-grout-check', title: 'Inspect bath caulk / grout and touch up if needed', area: 'Bathrooms', category: 'Preventive', frequency: 'Semiannual', cadenceDays: 180, reminderLeadDays: 30, effort: '30 min', season: 'Spring / Fall', priority: 'Important', notes: 'Especially around shower/tub edges to prevent moisture damage.', lastDone: '2025-10-01', major: true },
]

export const shoppingLists = [
  {
    id: 'home-depot',
    title: 'Home Depot',
    tone: 'violet',
    items: [
      { id: 'hd-1', name: 'Mini split coil cleaner', qty: '1', aisleHint: 'HVAC / cleaning', checked: false },
      { id: 'hd-2', name: 'Caulk + caulk tool', qty: '1 set', aisleHint: 'Bath / plumbing', checked: false },
      { id: 'hd-3', name: 'Drain hair catcher replacements', qty: '2', aisleHint: 'Plumbing', checked: true },
    ],
  },
  {
    id: 'grocery',
    title: 'Grocery',
    tone: 'rose',
    items: [
      { id: 'gr-1', name: 'Paper towels', qty: '1', aisleHint: 'Cleaning', checked: false },
      { id: 'gr-2', name: 'Dish soap', qty: '1', aisleHint: 'Cleaning', checked: false },
      { id: 'gr-3', name: 'Toilet bowl cleaner', qty: '1', aisleHint: 'Cleaning', checked: false },
    ],
  },
  {
    id: 'amazon',
    title: 'Amazon',
    tone: 'teal',
    items: [
      { id: 'am-1', name: 'Plant fertilizer spikes', qty: '1 box', aisleHint: 'Plants', checked: false },
      { id: 'am-2', name: 'Microfiber cleaning cloths', qty: '1 pack', aisleHint: 'Cleaning', checked: false },
      { id: 'am-3', name: 'Replacement air purifier filters', qty: '1 set', aisleHint: 'Home', checked: false },
    ],
  },
  {
    id: 'other',
    title: 'Other',
    tone: 'violet',
    storeName: '',
    items: [],
  },
  {
    id: 'costco',
    title: 'Costco',
    tone: 'gold',
    items: [
      { id: 'co-1', name: 'Trash bags', qty: '1 box', aisleHint: 'Household', checked: false },
      { id: 'co-2', name: 'Laundry detergent', qty: '1', aisleHint: 'Laundry', checked: false },
      { id: 'co-3', name: 'Replacement air fresheners / consumables', qty: '1', aisleHint: 'Household', checked: true },
    ],
  },
]
