import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Users, Eye, Heart, ChevronRight, CheckCircle, Clock, BookOpen, TrendingUp, Link2, GraduationCap, BriefcaseBusiness, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getPortfolioItems, resolveAssetUrl } from '../lib/api.js';
import { getRecommendedCourses } from '../lib/learning.js';

const emptyChartData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => ({
  name,
  views: 0,
}));

const deliverables = [
  { title: 'Complete your profile', date: 'Recommended', type: 'Profile' },
  { title: 'Upload your first portfolio item', date: 'Next step', type: 'Portfolio' },
];

const courseColors = ['bg-blue-500', 'bg-brand-500', 'bg-teal-500'];

function getUserTimeZone(user = {}) {
  return user.timezone || user.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getTimeOfDayGreeting(user = {}, date = new Date()) {
  const timeZone = getUserTimeZone(user);
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone,
    }).format(date),
  );

  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 15) return 'Good afternoon';
  if (hour >= 16 && hour <= 20) return 'Golden hours';
  return 'Action hours';
}

export default function Dashboard({ user, accountMode }) {
  const navigate = useNavigate();
  const isRecruiterMode = accountMode === 'RECRUITER';
  const [dashboard, setDashboard] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState('');
  const [timeOfDayGreeting, setTimeOfDayGreeting] = useState(() => getTimeOfDayGreeting(user));

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [statsData, portfolioData] = await Promise.all([
          getDashboardStats(),
          getPortfolioItems(),
        ]);

        if (!active) return;
        setDashboard(statsData);
        setPortfolio(portfolioData);
      } catch {
        if (!active) return;
        setDashboard(null);
        setPortfolio([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateGreeting = () => setTimeOfDayGreeting(getTimeOfDayGreeting(user));
    updateGreeting();

    const intervalId = window.setInterval(updateGreeting, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [user]);

  const chartData = dashboard?.chart_data?.length ? dashboard.chart_data : emptyChartData;
  const portfolioViews = portfolio.reduce((total, item) => total + (item.views || 0), 0);
  const appreciations = portfolio.reduce((total, item) => total + (item.likes || 0), 0);
  const trustScore = Math.round(dashboard?.trust_score ?? user.trustScore ?? 50);
  const trustLevel = dashboard?.trust_score_level ?? user.trustScoreLevel ?? 'Newcomer';
  const portfolioLink = `${window.location.origin}${window.location.pathname}#/profile/${user.id}`;
  const learningCourses = useMemo(() => getRecommendedCourses(user).slice(0, 3), [user]);
  const totalCoveredTopics = learningCourses.reduce((total, course) => total + course.coveredTopics, 0);
  const totalLearningTopics = learningCourses.reduce((total, course) => total + course.totalTopics, 0);
  const learningProgress = totalLearningTopics ? Math.round((totalCoveredTopics / totalLearningTopics) * 100) : 0;

  const handleSharePortfolio = async () => {
    try {
      await navigator.clipboard.writeText(portfolioLink);
      setShareMessage('Portfolio link copied');
    } catch {
      window.prompt('Copy your portfolio link', portfolioLink);
      setShareMessage('Portfolio link generated');
    }

    window.setTimeout(() => setShareMessage(''), 2400);
  };

  const stats = useMemo(
    () => [
      { icon: <Users className="text-blue-500" />, label: 'Portfolio Items', value: dashboard?.portfolio_count ?? user.portfolioCount ?? 0, change: 'Your work' },
      { icon: <Eye className="text-brand-500" />, label: 'Portfolio Views', value: portfolioViews, change: 'Live' },
      { icon: <Heart className="text-rose-500" />, label: 'Appreciations', value: appreciations, change: 'Live' },
      { icon: <TrendingUp className="text-teal-500" />, label: 'Trust Score', value: `${trustScore}%`, change: trustLevel },
    ],
    [appreciations, dashboard?.portfolio_count, portfolioViews, trustLevel, trustScore, user.portfolioCount],
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display dark:text-white">Namaste, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 dark:text-slate-400">{timeOfDayGreeting}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-2xl soft-shadow border border-slate-100 flex items-center space-x-2 dark:bg-slate-900 dark:border-slate-800">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold dark:text-slate-100">{trustLevel}</span>
          </div>
          <button
            onClick={handleSharePortfolio}
            className="bg-brand-600 text-white px-6 py-2 rounded-2xl font-bold soft-shadow hover:bg-brand-700 transition-all hover:scale-105 flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            {shareMessage || 'Share Portfolio'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl soft-shadow border border-slate-50 flex flex-col hover:border-brand-100 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:border-brand-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl dark:bg-slate-800">{stat.icon}</div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {stat.change}
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-1 dark:text-slate-400">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 font-display dark:text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] soft-shadow border border-slate-50 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold dark:text-white">Engagement Analytics</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Views from your uploaded work</p>
              </div>
              <select className="bg-slate-50 border-none text-xs font-bold p-2 rounded-xl outline-none dark:bg-slate-800 dark:text-slate-100">
                <option>Last 7 Days</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }} />
                  <Area type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display dark:text-white">Your Uploads</h3>
              <button className="text-brand-600 text-sm font-bold flex items-center hover:translate-x-1 transition-transform">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {portfolio.length ? (
                portfolio.map((work, i) => (
                  <motion.div
                    key={work.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                    className="group relative bg-white rounded-3xl overflow-hidden soft-shadow border border-slate-100 cursor-pointer dark:bg-slate-900 dark:border-slate-800"
                  >
                    {String(work.image_url).includes('.mp4') ? (
                      <video src={resolveAssetUrl(work.image_url)} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" muted />
                    ) : (
                      <img src={resolveAssetUrl(work.image_url)} alt={work.title} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1 dark:text-slate-100">{work.title}</h4>
                        {work.verification_status === 'verified' && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{work.category}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="sm:col-span-3 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                  {isLoading ? 'Loading your portfolio...' : 'No portfolio uploads yet.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {isRecruiterMode ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-[32px] soft-shadow border border-slate-50 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold font-display dark:text-white">Recruiter Workspace</h3>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Post roles and shortlist the strongest job seekers.</p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/jobs')}
                  className="flex w-full items-center justify-between rounded-2xl bg-brand-600 p-4 text-left text-white hover:bg-brand-700"
                >
                  <span className="flex items-center gap-3 text-sm font-bold"><BriefcaseBusiness className="h-5 w-5" /> Post a Job</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/candidates')}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <span className="flex items-center gap-3 text-sm font-bold"><UserCheck className="h-5 w-5 text-brand-500" /> Review Candidates</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-400">Candidate Matching</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Use role, location, and trust score filters to find job seekers who fit your hiring needs.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-[32px] soft-shadow border border-slate-50 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold font-display dark:text-white">Upskilling Course</h3>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {totalCoveredTopics} of {totalLearningTopics || 0} topics covered
                  </p>
                </div>
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {learningProgress}%
                </span>
              </div>
              <div className="space-y-6">
                {learningCourses.map((item, index) => (
                  <div key={item.title} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-lg bg-slate-50 p-2 text-brand-600 dark:bg-slate-800 dark:text-brand-300">
                          {index === 0 ? <GraduationCap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.title}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{item.progress}%</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {item.coveredTopics}/{item.totalTopics} topics covered from Udemy-style learning
                    </p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                        className={`h-full ${courseColors[index % courseColors.length]}`}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/learning')}
                  className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Continue Learning
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-[32px] soft-shadow border border-slate-50 dark:bg-slate-900 dark:border-slate-800"
          >
            <h3 className="text-lg font-bold mb-6 font-display dark:text-white">Next Steps</h3>
            <div className="space-y-4">
              {deliverables.map((notif) => (
                <div key={notif.title} className="flex items-start space-x-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group dark:hover:bg-slate-800">
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors dark:bg-slate-800 dark:group-hover:bg-slate-900">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{notif.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">{notif.date} - {notif.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
