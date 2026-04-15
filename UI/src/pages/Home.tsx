import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Film, Tv, Globe, Clapperboard, ArrowRight, LayoutDashboard, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchStats } from '@/lib/api';

const features = [
  {
    title: 'EDA Dashboard',
    description: 'Explore 5 interactive charts analyzing content over time, top genres, country production, and more.',
    icon: LayoutDashboard,
    path: '/dashboard',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Score Predictor',
    description: 'Use our XGBoost model to predict the IMDB score of a movie or show based on its features.',
    icon: TrendingUp,
    path: '/predict',
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Recommender',
    description: 'Find similar titles using our content-based recommendation engine.',
    icon: Sparkles,
    path: '/recommend',
    color: 'bg-secondary/10 text-secondary',
  },
];

const statIcons = [
  { key: 'totalTitles', title: 'Total Titles', icon: Film, color: 'text-blue-500' },
  { key: 'moviesShows', title: 'Movies vs Shows', icon: Tv, color: 'text-primary' },
  { key: 'countries', title: 'Countries', icon: Globe, color: 'text-green-500' },
  { key: 'genres', title: 'Genres', icon: Clapperboard, color: 'text-secondary' },
];

export function Home() {
  const [stats, setStats] = useState<{
    totalTitles: number;
    movies: number;
    shows: number;
    countries: number;
    genres: number;
  } | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => console.error('Stats fetch error:', err));
  }, []);

  const formatNumber = (n: number) => n.toLocaleString();

  const statValues = stats
    ? [
        { ...statIcons[0], value: formatNumber(stats.totalTitles) },
        { ...statIcons[1], value: `${formatNumber(stats.movies)} / ${formatNumber(stats.shows)}` },
        { ...statIcons[2], value: formatNumber(stats.countries) },
        { ...statIcons[3], value: formatNumber(stats.genres) },
      ]
    : statIcons.map((s) => ({ ...s, value: '—' }));

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold tracking-tighter"
            >
              Netflix Titles <span className="text-primary">Analytics</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Explore, analyze, and predict IMDB scores for thousands of movies and TV shows using advanced machine learning models.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link to="/dashboard" className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8")}>
                Explore Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link to="/predict" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-8 glass hover:bg-accent border-border text-foreground")}>
                Predict Score
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statValues.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="glass-card border-border bg-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Analytics Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dive deep into the dataset with our suite of interactive tools designed to uncover hidden patterns and insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={feature.path} className="block group">
                    <Card className="glass-card h-full border-border bg-transparent transition-all hover:border-border hover:bg-accent/50">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
