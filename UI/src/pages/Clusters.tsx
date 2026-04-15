import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network, Info, Loader2 } from 'lucide-react';
import { fetchClusters, ClusterRecord } from '@/lib/api';

interface UIClusterPoint {
  id: string;
  title: string;
  x: number;
  y: number;
  cluster: string;
  score: number;
  votes: number;
}

function mapCluster(r: ClusterRecord, i: number): UIClusterPoint {
  return {
    id: `c${i}`,
    title: r.title,
    x: r.x,
    y: r.y,
    cluster: r.cluster_label,
    score: r.imdb_score,
    votes: Math.round(Math.exp(r.log_votes)),
  };
}

export function Clusters() {
  const [clusterFilter, setClusterFilter] = useState('ALL');
  const [clusterData, setClusterData] = useState<UIClusterPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const clusters = [
    { name: 'Blockbusters', color: '#3b82f6', desc: 'High scores, massive popularity' },
    { name: 'Critically Acclaimed', color: '#10b981', desc: 'Very high scores, moderate popularity' },
    { name: 'Hidden Gems', color: '#8b5cf6', desc: 'Good scores, low popularity' },
    { name: 'Average', color: '#f5c518', desc: 'Average scores, mixed popularity' },
    { name: 'Flops', color: '#ef4444', desc: 'Low scores, low popularity' },
  ];

  useEffect(() => {
    setLoading(true);
    const label = clusterFilter === 'ALL' ? '' : clusterFilter;
    fetchClusters(label)
      .then((data) => setClusterData(data.map(mapCluster)))
      .catch((err) => console.error('Cluster fetch error:', err))
      .finally(() => setLoading(false));
  }, [clusterFilter]);

  // Derive unique cluster names from actual data for the legend
  const uniqueLabels: string[] = Array.from(new Set(clusterData.map(d => d.cluster)));

  // Map actual cluster labels to colors — use the predefined list first, fallback to a default
  const getClusterColor = (label: string) => {
    const found = clusters.find(c => c.name === label);
    return found?.color || '#888888';
  };

  // Build a dynamic legend from the data
  const legendItems = uniqueLabels.map(label => ({
    name: label,
    color: getClusterColor(label),
    desc: clusters.find(c => c.name === label)?.desc || '',
  }));

  const filteredData = clusterData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-popover border border-border p-3 rounded-md shadow-md max-w-[250px]">
          <p className="font-bold text-base mb-1">{data.title}</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getClusterColor(data.cluster) }} />
            <span className="text-sm font-medium">{data.cluster}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">IMDB Score:</span>
            <span className="font-medium text-right">{data.score}</span>
            <span className="text-muted-foreground">Votes:</span>
            <span className="font-medium text-right">{(data.votes / 1000).toFixed(0)}k</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" /> Content Clusters
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive 2D scatter plot of content clusters based on PCA dimensionality reduction.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border glass">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <Select value={clusterFilter} onValueChange={setClusterFilter}>
            <SelectTrigger className="w-[180px] h-8 bg-transparent border-border">
              <SelectValue placeholder="All Clusters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Clusters</SelectItem>
              {clusters.map(c => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-border bg-card/50 lg:col-span-3">
          <CardHeader>
            <CardTitle>PCA Projection</CardTitle>
            <CardDescription>
              X-axis: Principal Component 1 (Popularity/Budget proxy) • Y-axis: Principal Component 2 (Critical Reception proxy)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis type="number" dataKey="x" name="PC1" stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="y" name="PC2" stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                    <ZAxis type="number" dataKey="votes" range={[50, 400]} name="Votes" />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Titles" data={filteredData}>
                      {filteredData.map((entry, index) => {
                        const clusterColor = getClusterColor(entry.cluster);
                        return <Cell key={`cell-${index}`} fill={clusterColor} fillOpacity={0.7} stroke={clusterColor} strokeWidth={1} />;
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Info className="w-5 h-5" /> Cluster Legend
          </h3>
          <div className="space-y-3">
            {(legendItems.length > 0 ? legendItems : clusters).map(cluster => (
              <Card 
                key={cluster.name} 
                className={`border-border transition-colors cursor-pointer ${clusterFilter === cluster.name ? 'bg-secondary/20 border-primary/50' : 'bg-card/50 hover:bg-accent'}`}
                onClick={() => setClusterFilter(clusterFilter === cluster.name ? 'ALL' : cluster.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cluster.color }} />
                    <h4 className="font-medium leading-none">{cluster.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">{cluster.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
