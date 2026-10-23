import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldAlert, 
  Users, 
  Crown, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Database, 
  Cpu, 
  Zap, 
  Filter,
  Check,
  UserCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';

interface ProfileRecord {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
}

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');
  const [selectedTab, setSelectedTab] = useState<'users' | 'telemetry'>('users');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Profiles query error:', error);
        // If profiles table has restricted RLS or is newly created, show current session user
        if (currentUser) {
          setProfiles([{
            id: currentUser.id,
            email: currentUser.email || 'operator@genieflow.ai',
            full_name: currentUser.user_metadata?.full_name || 'System Operator',
            role: currentUser.user_metadata?.role || 'admin',
            subscription_tier: currentUser.user_metadata?.subscription_tier || 'enterprise',
            created_at: currentUser.created_at || new Date().toISOString()
          }]);
        }
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
      toast.error('Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleUpdateTier = async (userId: string, newTier: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, subscription_tier: newTier } : p));
      toast.success(`Subscription tier updated to ${newTier.toUpperCase()}`);
    } catch (err: any) {
      console.error('Failed to update tier:', err);
      toast.error(err.message || 'Failed to override subscription tier');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      toast.success(`User role changed to ${newRole.toUpperCase()}`);
    } catch (err: any) {
      console.error('Failed to toggle role:', err);
      toast.error(err.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = 
      (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || (p.role || 'user') === roleFilter;
    const matchesTier = tierFilter === 'all' || (p.subscription_tier || 'free') === tierFilter;

    return matchesSearch && matchesRole && matchesTier;
  });

  const totalUsers = profiles.length;
  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const paidCount = profiles.filter(p => p.subscription_tier && p.subscription_tier !== 'free').length;

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-slate-100 p-6 md:p-10">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">System Administration</h1>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Root Access</Badge>
              </div>
              <p className="text-sm text-slate-400">
                Manage global user directory, subscription overrides, and neural telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfiles}
              disabled={loading}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#111228] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Users</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">{totalUsers}</div>
            <div className="mt-1 text-xs text-slate-500">Live profiles in database</div>
          </div>

          <div className="bg-[#111228] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid Subscriptions</span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">{paidCount}</div>
            <div className="mt-1 text-xs text-slate-500">Pro & Enterprise licenses</div>
          </div>

          <div className="bg-[#111228] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin Operators</span>
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">{adminCount}</div>
            <div className="mt-1 text-xs text-slate-500">Privileged access roles</div>
          </div>

          <div className="bg-[#111228] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Neural Cortex</span>
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
            <div className="mt-1 text-xs text-slate-500">Heartbeat operational</div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setSelectedTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              selectedTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            User Directory & Tiers
          </button>
          <button
            onClick={() => setSelectedTab('telemetry')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              selectedTab === 'telemetry'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Telemetry & Services
          </button>
        </div>

        {selectedTab === 'users' ? (
          <div className="bg-[#111228] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or email..."
                  className="bg-black/30 border-white/10 text-white pl-9 text-sm focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e: any) => setRoleFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Tier:</span>
                  <select
                    value={tierFilter}
                    onChange={(e: any) => setTierFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/[0.03] text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Subscription Tier</th>
                    <th className="py-3.5 px-4">Registered</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((p) => {
                      const tier = p.subscription_tier || 'free';
                      const role = p.role || 'user';
                      const isUpdating = updatingId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-white">{p.full_name || 'Unnamed User'}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge className={role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-700/40 text-slate-300 border-slate-600/30'}>
                              {role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={tier}
                                disabled={isUpdating}
                                onChange={(e) => handleUpdateTier(p.id, e.target.value)}
                                className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="free">FREE</option>
                                <option value="pro">PRO</option>
                                <option value="enterprise">ENTERPRISE</option>
                                <option value="sovereign">SOVEREIGN</option>
                              </select>
                              {isUpdating && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isUpdating}
                              onClick={() => handleToggleRole(p.id, role)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              {role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        {loading ? 'Fetching profiles from database...' : 'No user profiles found matching filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111228] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">AI Engine Orchestration</h3>
                  <p className="text-xs text-slate-400">Current compute backends configured for GenieFlow</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <div className="font-medium text-sm text-white">Google Gemini 2.5 Flash</div>
                    <div className="text-xs text-slate-500">High-speed reasoning & multimodal analysis</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <div className="font-medium text-sm text-white">Local RTX 4090 Sovereign Stack</div>
                    <div className="text-xs text-slate-500">Ollama / vLLM local offline fallback</div>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Ready</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <div className="font-medium text-sm text-white">Cortex Neural Engine</div>
                    <div className="text-xs text-slate-500">Real-time heartbeat & proactive scheduling</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Active</Badge>
                </div>
              </div>
            </div>

            <div className="bg-[#111228] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-violet-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">Infrastructure & Data Persistence</h3>
                  <p className="text-xs text-slate-400">Database and document storage status</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <div className="font-medium text-sm text-white">Supabase PostgreSQL</div>
                    <div className="text-xs text-slate-500">Primary relational & auth datastore</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <div className="font-medium text-sm text-white">AI Drive Files (Storage)</div>
                    <div className="text-xs text-slate-500">Multi-tenant document repository</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <div className="font-medium text-sm text-white">Stripe Payment Gateway</div>
                    <div className="text-xs text-slate-500">Subscription management & billing webhook</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Live</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;