export const courseCatalog = [
  {
    id: 'director-lighting-language',
    title: 'Lighting Language for Directors',
    roles: ['Direction', 'Director', 'Filmmaker', 'Cinematographer', 'Lighting', 'Gaffer'],
    level: 'Intermediate',
    duration: '4h 10m',
    rating: 4.8,
    progress: 68,
    coveredTopics: 7,
    totalTopics: 10,
    udemyQuery: 'film lighting for directors cinematography',
  },
  {
    id: 'commercial-photography-lighting',
    title: 'Commercial Photography Lighting',
    roles: ['Photography', 'Photographer', 'Camera', 'Portrait', 'Lighting'],
    level: 'Advanced',
    duration: '5h 05m',
    rating: 4.9,
    progress: 42,
    coveredTopics: 5,
    totalTopics: 12,
    udemyQuery: 'photography lighting professional photographer',
  },
  {
    id: 'photography-portfolio-editing',
    title: 'Photography Portfolio and Editing',
    roles: ['Photography', 'Photographer', 'Lightroom', 'Photoshop'],
    level: 'Beginner',
    duration: '3h 30m',
    rating: 4.8,
    progress: 24,
    coveredTopics: 3,
    totalTopics: 12,
    udemyQuery: 'photography portfolio lightroom editing',
  },
  {
    id: 'cinematic-video-editing-workflow',
    title: 'Cinematic Video Editing Workflow',
    roles: ['Video Edit', 'Editor', 'Colorist', 'Premiere Pro', 'DaVinci Resolve'],
    level: 'Intermediate',
    duration: '4h 20m',
    rating: 4.9,
    progress: 55,
    coveredTopics: 6,
    totalTopics: 11,
    udemyQuery: 'video editing premiere pro davinci resolve',
  },
  {
    id: 'direction-shot-planning',
    title: 'Direction and Shot Planning',
    roles: ['Direction', 'Director', 'Assistant Director', 'Filmmaker'],
    level: 'Intermediate',
    duration: '3h 45m',
    rating: 4.7,
    progress: 35,
    coveredTopics: 4,
    totalTopics: 11,
    udemyQuery: 'film directing shot planning',
  },
  {
    id: 'scriptwriting-short-films',
    title: 'Scriptwriting for Short Films',
    roles: ['Story Writing', 'Writer', 'Scriptwriter', 'Screenwriter'],
    level: 'Beginner',
    duration: '2h 55m',
    rating: 4.6,
    progress: 18,
    coveredTopics: 2,
    totalTopics: 10,
    udemyQuery: 'screenwriting short film scriptwriting',
  },
  {
    id: 'brand-design-fundamentals',
    title: 'Brand Design Fundamentals',
    roles: ['Branding', 'Designer', 'Graphic Design', 'Creative'],
    level: 'Beginner',
    duration: '2h 40m',
    rating: 4.7,
    progress: 30,
    coveredTopics: 3,
    totalTopics: 10,
    udemyQuery: 'brand design graphic design fundamentals',
  },
  {
    id: 'client-communication-freelancers',
    title: 'Client Communication for Freelancers',
    roles: ['CREATIVE', 'Freelancer', 'Photographer', 'Designer', 'Editor'],
    level: 'Beginner',
    duration: '1h 40m',
    rating: 4.8,
    progress: 80,
    coveredTopics: 8,
    totalTopics: 10,
    udemyQuery: 'freelancer client communication creative professionals',
  },
  {
    id: 'recruiter-screening-basics',
    title: 'Recruiter Talent Screening Basics',
    roles: ['RECRUITER', 'Hiring', 'Talent Acquisition'],
    level: 'Beginner',
    duration: '2h 25m',
    rating: 4.5,
    progress: 20,
    coveredTopics: 2,
    totalTopics: 10,
    udemyQuery: 'recruiter talent acquisition screening',
  },
];

export function normalizeLearningValue(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function roleMatches(userRole, courseRole) {
  const userValue = normalizeLearningValue(userRole);
  const courseValue = normalizeLearningValue(courseRole);
  if (!userValue || !courseValue) return false;
  return userValue.includes(courseValue) || courseValue.includes(userValue);
}

export function getUserLearningRoles(user = {}) {
  return [user.role, ...(user.roles || []), ...(user.interestedRoles || []), ...(user.skills || [])].filter(Boolean);
}

function readProgressOverrides(user = {}) {
  const explicitProgress = user.learningProgress || user.learning_progress || {};

  if (typeof window === 'undefined') return explicitProgress;

  try {
    const stored = window.localStorage.getItem(`talentverse_learning_progress_${user.id || 'guest'}`);
    return {
      ...explicitProgress,
      ...(stored ? JSON.parse(stored) : {}),
    };
  } catch {
    return explicitProgress;
  }
}

function applyProgress(course, overrides) {
  const override = overrides[course.id] ?? overrides[course.title];
  const rawProgress = typeof override === 'number' ? override : override?.progress;
  const progress = Math.max(0, Math.min(100, Math.round(rawProgress ?? course.progress ?? 0)));
  const totalTopics = Math.max(1, override?.totalTopics ?? course.totalTopics ?? 10);
  const coveredTopics = Math.max(
    0,
    Math.min(totalTopics, override?.coveredTopics ?? Math.round((progress / 100) * totalTopics)),
  );

  return {
    ...course,
    progress,
    totalTopics,
    coveredTopics,
  };
}

export function getRecommendedCourses(user = {}) {
  const userRoles = getUserLearningRoles(user);
  const overrides = readProgressOverrides(user);

  return courseCatalog
    .map((course) => {
      const score = course.roles.reduce((total, role) => (
        userRoles.some((userRole) => roleMatches(userRole, role))
          ? total + 1
          : total
      ), 0);

      return { ...applyProgress(course, overrides), score };
    })
    .filter((course) => course.score > 0 || course.roles.includes(user.role) || course.roles.includes('CREATIVE'))
    .sort((a, b) => b.score - a.score || b.progress - a.progress || b.rating - a.rating);
}

export function udemyUrl(course, userRoles) {
  const matchedRole = userRoles.find((userRole) => course.roles.some((role) => roleMatches(userRole, role)));
  const query = matchedRole
    ? `${matchedRole} ${course.udemyQuery || course.title}`
    : (course.udemyQuery || course.title);
  return `https://www.udemy.com/courses/search/?src=ukw&q=${encodeURIComponent(query)}`;
}
