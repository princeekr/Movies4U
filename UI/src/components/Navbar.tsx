import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, LayoutDashboard, Search, TrendingUp, Sparkles, Network, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { buttonVariants, Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Film },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explorer', path: '/explore', icon: Search },
    { name: 'Predictor', path: '/predict', icon: TrendingUp },
    { name: 'Recommender', path: '/recommend', icon: Sparkles },
    { name: 'Clusters', path: '/clusters', icon: Network },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Film className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Movies<span className="text-primary">4U</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-accent-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
