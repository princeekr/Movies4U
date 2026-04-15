import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { predictScore } from '@/lib/api';

export function Predictor() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);

  // Controlled form state
  const [showType, setShowType] = useState('MOVIE');
  const [year, setYear] = useState('2024');
  const [runtime, setRuntime] = useState('120');
  const [ageCert, setAgeCert] = useState('PG-13');
  const [genre, setGenre] = useState('drama');
  const [votes, setVotes] = useState('10000');
  const [country, setCountry] = useState('US');

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setPrediction(null);
    
    try {
      const score = await predictScore({
        genre: genre.toLowerCase(),
        runtime: Number(runtime),
        year: Number(year),
        show_type: showType,
        age_cert: ageCert,
        country,
        votes: Number(votes),
      });
      setPrediction(Math.round(score * 10) / 10);
    } catch (err) {
      console.error('Prediction error:', err);
      setPrediction(null);
    } finally {
      setIsPredicting(false);
    }
  };

  const getScoreDetails = (score: number) => {
    if (score >= 8.0) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 6.5) return { label: 'Good', color: 'text-secondary', bg: 'bg-secondary' };
    if (score >= 5.0) return { label: 'Average', color: 'text-orange-500', bg: 'bg-orange-500' };
    return { label: 'Poor', color: 'text-destructive', bg: 'bg-destructive' };
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">IMDB Score Predictor</h1>
        <p className="text-muted-foreground">
          Enter the details of a movie or TV show to predict its IMDB score using our trained XGBoost model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card border-white/5 bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> Input Features
            </CardTitle>
            <CardDescription>Provide the characteristics of the title.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={showType} onValueChange={setShowType}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOVIE">Movie</SelectItem>
                      <SelectItem value="SHOW">TV Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Release Year</label>
                  <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1900} max={2030} className="bg-white/5 border-white/10" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Runtime (mins)</label>
                  <Input type="number" value={runtime} onChange={(e) => setRuntime(e.target.value)} min={1} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age Certification</label>
                  <Select value={ageCert} onValueChange={setAgeCert}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="PG">PG</SelectItem>
                      <SelectItem value="PG-13">PG-13</SelectItem>
                      <SelectItem value="R">R</SelectItem>
                      <SelectItem value="TV-MA">TV-MA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Genre</label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="scifi">Sci-Fi</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Votes</label>
                  <Input type="number" value={votes} onChange={(e) => setVotes(e.target.value)} min={0} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Production Country</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="KR">South Korea</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white mt-6" disabled={isPredicting}>
                {isPredicting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Predicting...
                  </>
                ) : (
                  'Predict Score'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            {isPredicting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <Calculator className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <p className="text-muted-foreground animate-pulse">Running XGBoost model...</p>
              </motion.div>
            ) : prediction !== null ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center w-full"
              >
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="currentColor" strokeWidth="8" 
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * prediction) / 10 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={getScoreDetails(prediction).color}
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold font-display">{prediction.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/ 10</span>
                  </div>
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${getScoreDetails(prediction).color}`}>
                  {getScoreDetails(prediction).label}
                </h3>
                <p className="text-muted-foreground max-w-xs">
                  Based on historical data, titles with these characteristics typically receive this score.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center text-muted-foreground p-8 border border-dashed border-white/10 rounded-xl"
              >
                <Star className="w-16 h-16 mb-4 opacity-20" />
                <p>Fill out the form and click Predict to see the estimated IMDB score.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
