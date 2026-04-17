import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Star, Clock, Calendar, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { fetchTitles, TitleRecord } from '@/lib/api';

// Shape expected by the UI (richer than what the API returns)
interface UITitle {
  id: string;
  title: string;
  type: string;
  releaseYear: number;
  ageCertification: string;
  runtime: number;
  genres: string[];
  productionCountries: string[];
  imdbScore: number;
  imdbVotes: number;
  description: string;
}

function mapApiToUI(r: TitleRecord): UITitle {
  return {
    id: r.id,
    title: r.title,
    type: r.show_type,
    releaseYear: r.release_year,
    ageCertification: r.age_certification ?? '',
    runtime: 0,
    genres: r.primary_genre ? [r.primary_genre] : [],
    productionCountries: [],
    imdbScore: r.imdb_score ?? 0,
    imdbVotes: 0,
    description: '',
  };
}

export function Explorer() {
  const [allTitles, setAllTitles] = useState<UITitle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [yearRange, setYearRange] = useState([1990, 2024]);
  const [scoreRange, setScoreRange] = useState([0, 10]);
  const [selectedTitle, setSelectedTitle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTitles()
      .then((data) => setAllTitles(data.map(mapApiToUI)))
      .catch((err) => console.error('Titles fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    allTitles.forEach(t => t.genres.forEach(g => genres.add(g)));
    return Array.from(genres).sort();
  }, [allTitles]);

  const filteredTitles = useMemo(() => {
    return allTitles.filter(title => {
      const matchesSearch = title.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'ALL' || title.type === typeFilter;
      const matchesGenre = genreFilter === 'ALL' || title.genres.includes(genreFilter);
      const matchesYear = title.releaseYear >= yearRange[0] && title.releaseYear <= yearRange[1];
      const matchesScore = title.imdbScore >= scoreRange[0] && title.imdbScore <= scoreRange[1];
      
      return matchesSearch && matchesType && matchesGenre && matchesYear && matchesScore;
    });
  }, [allTitles, searchQuery, typeFilter, genreFilter, yearRange, scoreRange]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      {/* Filters Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-6">
        <div className="sticky top-24 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filters
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search titles..." 
                className="pl-9 bg-white/5 border-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="MOVIE">Movies</SelectItem>
                  <SelectItem value="SHOW">TV Shows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Genre</label>
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Genres</SelectItem>
                  {allGenres.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Release Year</label>
                <span className="text-xs">{yearRange[0]} - {yearRange[1]}</span>
              </div>
              <Slider 
                value={yearRange} 
                onValueChange={setYearRange} 
                min={1990} 
                max={2024} 
                step={1} 
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">IMDB Score</label>
                <span className="text-xs">{scoreRange[0]} - {scoreRange[1]}</span>
              </div>
              <Slider 
                value={scoreRange} 
                onValueChange={setScoreRange} 
                min={0} 
                max={10} 
                step={0.1} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {loading ? 'Loading...' : `Results (${filteredTitles.length})`}
          </h2>
        </div>

        {!loading && filteredTitles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No titles found matching your filters.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setGenreFilter('ALL');
                setYearRange([1990, 2024]);
                setScoreRange([0, 10]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTitles.map(title => (
              <Card 
                key={title.id} 
                className="glass-card border-border bg-card/50 cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => setSelectedTitle(title)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors" title={title.title}>
                      {title.title}
                    </CardTitle>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 shrink-0 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500" /> {title.imdbScore}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <span>{title.releaseYear}</span>
                    <span>•</span>
                    <span>{title.type === 'MOVIE' ? 'Movie' : 'TV Show'}</span>
                    {title.ageCertification && (
                      <>
                        <span>•</span>
                        <span>{title.ageCertification}</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {title.genres.slice(0, 3).map(g => (
                      <Badge key={g} variant="secondary" className="bg-white/5 text-xs font-normal">
                        {g}
                      </Badge>
                    ))}
                    {title.genres.length > 3 && (
                      <Badge variant="secondary" className="bg-white/5 text-xs font-normal">
                        +{title.genres.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedTitle} onOpenChange={(open) => !open && setSelectedTitle(null)}>
        <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-white/10">
          {selectedTitle && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedTitle.title}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {selectedTitle.releaseYear}</span>
                      {selectedTitle.runtime > 0 && (
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedTitle.runtime} min</span>
                      )}
                      {selectedTitle.productionCountries.length > 0 && (
                        <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {selectedTitle.productionCountries.join(', ')}</span>
                      )}
                      <Badge variant="outline">{selectedTitle.ageCertification}</Badge>
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1 pr-6">
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xl">
                      <Star className="w-5 h-5 fill-amber-500" /> {selectedTitle.imdbScore}
                    </div>
                    {selectedTitle.imdbVotes > 0 && (
                      <span className="text-xs text-muted-foreground">{(selectedTitle.imdbVotes / 1000).toFixed(1)}k votes</span>
                    )}
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {selectedTitle.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Synopsis</h4>
                    <p className="text-sm leading-relaxed">{selectedTitle.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTitle.genres.map((g: string) => (
                      <Badge key={g} variant="secondary" className="bg-white/10">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="outline" onClick={() => setSelectedTitle(null)}>Close</Button>
                <Link to={`/recommend?title=${encodeURIComponent(selectedTitle.title)}`} className={cn(buttonVariants(), "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                  Get Recommendations
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
