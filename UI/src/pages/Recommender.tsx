import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchTitles, fetchRecommendations, TitleRecord } from '@/lib/api';
import { motion } from 'motion/react';

// Shape used internally for display
interface UITitle {
  id: string;
  title: string;
  type: string;
  releaseYear: number;
  ageCertification: string;
  imdbScore: number;
  genres: string[];
  description: string;
}

function mapTitle(r: TitleRecord): UITitle {
  return {
    id: r.id,
    title: r.title,
    type: r.show_type,
    releaseYear: r.release_year,
    ageCertification: 'N/A',
    imdbScore: r.imdb_score ?? 0,
    genres: r.primary_genre ? [r.primary_genre] : [],
    description: '',
  };
}

export function Recommender() {
  const [searchParams] = useSearchParams();
  const initialTitle = searchParams.get('title') || '';
  
  const [allTitles, setAllTitles] = useState<UITitle[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialTitle);
  const [selectedTitle, setSelectedTitle] = useState<UITitle | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch titles for autocomplete
  useEffect(() => {
    fetchTitles()
      .then((data) => {
        const mapped = data.map(mapTitle);
        setAllTitles(mapped);
        // If we have an initial title from URL params, auto-select it
        if (initialTitle) {
          const found = mapped.find(t => t.title.toLowerCase() === initialTitle.toLowerCase());
          if (found) {
            handleSelectTitle(found);
          }
        }
      })
      .catch((err) => console.error('Titles fetch error:', err));
  }, []);

  // Filter for autocomplete
  const searchResults = searchQuery.length > 1 && !selectedTitle 
    ? allTitles.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const handleSelectTitle = async (title: UITitle) => {
    setSelectedTitle(title);
    setSearchQuery(title.title);
    setIsSearching(true);
    
    try {
      const recs = await fetchRecommendations(title.title, 6);
      // Cosine similarities are very high (0.999x). Normalize to a useful display range.
      const scores = recs.map(r => r.sim_score ?? 0);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const range = maxScore - minScore;

      const mapped = recs.map(r => {
        // Normalize: best match → 99%, worst in set → ~75%
        const normalized = range > 0
          ? 75 + ((r.sim_score - minScore) / range) * 24
          : 95;
        return {
          id: r.id,
          title: r.title,
          type: r.show_type,
          releaseYear: r.release_year,
          genres: r.primary_genre ? [r.primary_genre] : [],
          imdbScore: r.imdb_score ?? 0,
          description: '',
          similarity: Math.round(normalized),
        };
      });
      setRecommendations(mapped);
    } catch (err) {
      console.error('Recommendation error:', err);
      setRecommendations([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-secondary" /> Content Recommender
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover similar movies and TV shows based on content features, genres, and descriptions using our NLP similarity engine.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12 relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search for a movie or TV show..." 
            className="pl-12 h-14 text-lg bg-background text-foreground border-input rounded-full"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedTitle && e.target.value !== selectedTitle.title) {
                setSelectedTitle(null);
                setRecommendations([]);
              }
            }}
          />
        </div>
        
        {/* Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-10 glass-card border-border overflow-hidden">
            <ul className="py-2">
              {searchResults.map(title => (
                <li 
                  key={title.id}
                  className="px-4 py-3 hover:bg-accent cursor-pointer flex items-center justify-between transition-colors"
                  onClick={() => handleSelectTitle(title)}
                >
                  <div>
                    <div className="font-medium">{title.title}</div>
                    <div className="text-xs text-muted-foreground">{title.releaseYear} • {title.type === 'MOVIE' ? 'Movie' : 'TV Show'}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {selectedTitle && (
        <div className="space-y-12">
          {/* Source Title */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Target Title</h3>
            <Card className="glass-card border-primary/30 bg-primary/5 w-full max-w-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedTitle.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {selectedTitle.releaseYear} • {selectedTitle.type === 'MOVIE' ? 'Movie' : 'TV Show'} • {selectedTitle.ageCertification}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-lg py-1">
                    <Star className="w-4 h-4 fill-amber-500 mr-1" /> {selectedTitle.imdbScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTitle.description && (
                  <p className="text-sm text-muted-foreground mb-4">{selectedTitle.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedTitle.genres.map((g: string) => (
                    <Badge key={g} variant="secondary" className="bg-secondary/20">{g}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" /> Recommended for you
            </h3>
            
            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="glass-card border-border bg-card/50 animate-pulse h-48" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="glass-card border-border bg-card/50 h-full flex flex-col hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="line-clamp-1 text-lg" title={rec.title}>{rec.title}</CardTitle>
                          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 shrink-0">
                            {rec.similarity}% Match
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {rec.releaseYear} • {rec.type === 'MOVIE' ? 'Movie' : 'TV Show'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        {rec.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{rec.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {rec.genres.slice(0, 3).map((g: string) => (
                            <Badge key={g} variant="secondary" className="bg-secondary/10 text-[10px] px-1.5 py-0">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
