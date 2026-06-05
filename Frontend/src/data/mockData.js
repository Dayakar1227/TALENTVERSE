// ─── Mock Users ───────────────────────────────────────────────────────────────
// ─── Mock Jobs ────────────────────────────────────────────────────────────────
export const mockJobs = [
  { id: 'j1', title: 'Senior Commercial Photographer', company: 'Creative India Labs',    companyId: 'c1', location: 'Mumbai (Andheri)',  salary: '₹15L - ₹25L PA',    type: 'Full-time', category: 'Photography',   minTrustScore: 85 },
  { id: 'j2', title: 'Video Editor (OTT Series)',       company: 'Desi Reels Productions', companyId: 'c2', location: 'Bengaluru',         salary: '₹80k - ₹1.2L /mo',  type: 'Contract',  category: 'Video Edit',    minTrustScore: 70 },
  { id: 'j3', title: 'Art Director',                    company: 'Delhi Design House',     companyId: 'c3', location: 'New Delhi',          salary: '₹18L - ₹30L PA',    type: 'Full-time', category: 'Direction',     minTrustScore: 90 },
  { id: 'j4', title: 'Product Colorist',                company: 'Hyderabad Motion Tech',  companyId: 'c4', location: 'Remote',             salary: '₹3,500 /hr',         type: 'Freelance', category: 'Video Edit',    minTrustScore: 80 },
  { id: 'j5', title: 'Scriptwriter (Vernacular)',        company: 'Desi Reels Productions', companyId: 'c2', location: 'Chennai',            salary: '₹6L - ₹10L PA',     type: 'Contract',  category: 'Story Writing', minTrustScore: 75 },
  { id: 'j6', title: 'Assistant Film Director',          company: 'Delhi Design House',     companyId: 'c3', location: 'Mumbai',             salary: '₹12L+ PA',           type: 'Full-time', category: 'Direction',     minTrustScore: 85 },
];

// ─── Mock Companies ───────────────────────────────────────────────────────────
export const mockCompanies = {
  c1: {
    id: 'c1',
    name: 'Creative India Labs',
    logo: 'https://picsum.photos/seed/ci/200/200',
    banner: 'https://picsum.photos/seed/ci_banner/1200/400',
    mission: 'Empowering Bharat with world-class visual storytelling.',
    description: "Creative India Labs is Mumbai's premier agency for commercial photography. We have worked with top Indian brands to create iconic campaigns that resonate with the Indian heart.",
    industry: 'Advertising & Marketing',
    size: '100-200 Employees',
    website: 'https://creativeindialabs.in',
    location: 'Mumbai, India',
  },
  c2: {
    id: 'c2',
    name: 'Desi Reels Productions',
    logo: 'https://picsum.photos/seed/dr/200/200',
    banner: 'https://picsum.photos/seed/dr_banner/1200/400',
    mission: 'The future of Indian OTT and digital content.',
    description: 'Based in Bengaluru, we are a digital-first production house focusing on high-engagement social content and OTT web-series. Our team is at the intersection of technology and art.',
    industry: 'Media Production',
    size: '50-100 Employees',
    website: 'https://desireels.com',
    location: 'Bengaluru, India',
  },
  c3: {
    id: 'c3',
    name: 'Delhi Design House',
    logo: 'https://picsum.photos/seed/ddh/200/200',
    banner: 'https://picsum.photos/seed/ddh_banner/1200/400',
    mission: 'Crafting luxury visual identities for the modern India.',
    description: 'A design consulting firm based in South Delhi. We specialize in premium branding for lifestyle and fashion brands, bridging the gap between heritage and modern aesthetics.',
    industry: 'Design Services',
    size: '20-50 Employees',
    website: 'https://delhidesignhouse.in',
    location: 'New Delhi, India',
  },
  c4: {
    id: 'c4',
    name: 'Hyderabad Motion Tech',
    logo: 'https://picsum.photos/seed/hmt/200/200',
    banner: 'https://picsum.photos/seed/hmt_banner/1200/400',
    mission: 'Pioneering VFX and post-production for Indian cinema.',
    description: 'A specialized post-production studio in Hitech City. We handle VFX and color grading for some of the biggest blockbusters in South Indian cinema.',
    industry: 'Entertainment',
    size: '40-80 Employees',
    website: 'https://hyderabadmotion.io',
    location: 'Hyderabad, India',
  },
};

// ─── Mock Portfolio ───────────────────────────────────────────────────────────
export const mockPortfolio = [
  { id: '1', title: 'Monsoon in Mumbai',        imageUrl: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?q=80&w=400&h=300&auto=format&fit=crop', category: 'Photography',   verified: true },
  { id: '2', title: 'Street Food Cinematic',    imageUrl: 'https://images.unsplash.com/photo-1567129937968-cdad8f07e2f8?q=80&w=400&h=300&auto=format&fit=crop', category: 'Video Edit',    verified: true },
  { id: '3', title: 'Rajasthani Folklore Script', imageUrl: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=400&h=300&auto=format&fit=crop', category: 'Story Writing', verified: true },
];

// ─── Mock Chart Data ──────────────────────────────────────────────────────────
export const mockChartData = [
  { name: 'Mon', views: 1200 },
  { name: 'Tue', views: 1800 },
  { name: 'Wed', views: 2400 },
  { name: 'Thu', views: 2100 },
  { name: 'Fri', views: 3500 },
  { name: 'Sat', views: 4200 },
  { name: 'Sun', views: 3900 },
];

// ─── Mock Collaborations ──────────────────────────────────────────────────────
export const mockCollabs = [
  {
    id: 'c1',
    title: 'Short Film: "The Tea Stall"',
    creatorName: 'Arjun Mehra',
    creatorAvatar: 'https://picsum.photos/seed/arjun/100',
    location: 'Andheri West, Mumbai',
    distance: '1.2 km away',
    rolesNeeded: ['Director', 'Cinematographer', 'Editor'],
    budgetType: 'Passion Project',
    description: 'Looking for a small crew to film a heart-touching story at a local tea stall. Exploring themes of Mumbai life.',
    category: 'Film',
    createdAt: '2 hrs ago',
  },
  {
    id: 'c2',
    title: 'Street Photography: Cubbon Park',
    creatorName: 'Priya Sharma',
    creatorAvatar: 'https://picsum.photos/seed/priya/100',
    location: 'Bengaluru',
    distance: '3.5 km away',
    rolesNeeded: ['Photographer', 'Stylist'],
    budgetType: 'Split',
    description: 'Planning a Sunday morning photowalk at Cubbon Park. Models and stylists needed for a portfolio refresh.',
    category: 'Photography',
    createdAt: '5 hrs ago',
  },
  {
    id: 'c3',
    title: 'Indie Pop Music Video',
    creatorName: 'Rohan Gupta',
    creatorAvatar: 'https://picsum.photos/seed/rohan/100',
    location: 'Hauz Khas Village, Delhi',
    distance: '5.8 km away',
    rolesNeeded: ['Lighting Tech', 'Editor'],
    budgetType: 'Low Budget',
    description: 'Shooting a music video for a new indie artist. Small budget for logistics, great for portfolio building.',
    category: 'Video',
    createdAt: '1 day ago',
  },
  {
    id: 'c4',
    title: 'Experimental Theatre Doc',
    creatorName: 'Ishaan Reddy',
    creatorAvatar: 'https://picsum.photos/seed/ishaan/100',
    location: 'Hyderabad',
    distance: '8.1 km away',
    rolesNeeded: ['Sound Engineer', 'Cameraman'],
    budgetType: 'Passion Project',
    description: 'Documenting the rehearsal of a local Telugu theatre group. Need someone passionate about sound.',
    category: 'Film',
    createdAt: '2 days ago',
  },
];
