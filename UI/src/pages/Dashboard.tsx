import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import {
  fetchContentOverTimeCombined,
  fetchGenrePopularity,
  fetchCountryProduction,
  fetchScoreDistribution,
  fetchAgeCertification,
} from '@/lib/api';

export function Dashboard() {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [genreCount, setGenreCount] = useState([10]);

  const [contentData, setContentData] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<any[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchContentOverTimeCombined(),
      fetchGenrePopularity(15),
      fetchCountryProduction(),
      fetchScoreDistribution(),
      fetchAgeCertification(),
    ])
      .then(([content, genres, countries, scores, ages]) => {
        setContentData(content);
        setGenreData(genres);
        setCountryData(countries);
        setScoreData(scores);
        setAgeData(ages);
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Color scale for IMDB scores
  const getScoreColor = (score: number) => {
    if (score >= 7.5) return '#10b981'; // Green
    if (score >= 6.5) return '#f5c518'; // IMDB Gold
    if (score >= 5.5) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-md shadow-md text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
          {payload[0].payload.avgScore && (
            <div className="mt-1 pt-1 border-t border-border text-xs text-muted-foreground">
              Avg Score: <span className="font-medium text-foreground">{payload[0].payload.avgScore}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exploratory Data Analysis</h1>
          <p className="text-muted-foreground">Interactive visualizations of the Netflix dataset.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-background p-2 rounded-lg border border-border glass">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Type:</span>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] h-8 bg-transparent border-border">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="MOVIE">Movies</SelectItem>
                <SelectItem value="SHOW">TV Shows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Over Time */}
        <Card className="glass-card border-border bg-transparent col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                  <XAxis dataKey="year" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {(typeFilter === 'ALL' || typeFilter === 'MOVIE') && (
                    <Line type="monotone" dataKey="movies" name="Movies" stroke="#e50914" strokeWidth={3} dot={{ r: 4, fill: '#e50914' }} activeDot={{ r: 6 }} />
                  )}
                  {(typeFilter === 'ALL' || typeFilter === 'SHOW') && (
                    <Line type="monotone" dataKey="shows" name="TV Shows" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Genres */}
        <Card className="glass-card border-border bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Genres</CardTitle>
            <div className="flex items-center gap-2 w-32">
              <span className="text-xs text-muted-foreground">Top {genreCount[0]}</span>
              <Slider 
                value={genreCount} 
                onValueChange={setGenreCount} 
                max={15} 
                min={5} 
                step={1}
                className="w-20"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genreData.slice(0, genreCount[0])} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} horizontal={false} />
                  <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="genre" type="category" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {genreData.slice(0, genreCount[0]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.avgScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Country Production */}
        <Card className="glass-card border-border bg-transparent">
          <CardHeader>
            <CardTitle>Country Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} horizontal={false} />
                  <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="country" type="category" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="glass-card border-border bg-transparent">
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                  <XAxis dataKey="range" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {(typeFilter === 'ALL' || typeFilter === 'MOVIE') && (
                    <Bar dataKey="movies" name="Movies" fill="#e50914" radius={[4, 4, 0, 0]} />
                  )}
                  {(typeFilter === 'ALL' || typeFilter === 'SHOW') && (
                    <Bar dataKey="shows" name="TV Shows" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Age Certification */}
        <Card className="glass-card border-border bg-transparent">
          <CardHeader>
            <CardTitle>Age Certification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                  <XAxis dataKey="cert" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.avgScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
