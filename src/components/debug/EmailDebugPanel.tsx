import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useEmail } from '../../contexts/EmailContext';
import { useAuth } from '../../contexts/AuthContext';
import { getEnv, updateEnvConfig } from '../../config/env';
import { toast } from 'sonner';
import { RefreshCw, Mail, Settings, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useTeam } from '../../contexts/TeamContext';
import { TeamService } from '../../services/team/teamService';
import { EmailService } from '../../services/email/emailService';
import { supabase } from '../../lib/supabase';

export function EmailDebugPanel() {
  const { accounts, loading, error, refreshAccounts } = useEmail();
  const { user, isLoading: authLoading } = useAuth();
  const { teams, activeTeam, refreshTeams, loading: teamLoading } = useTeam();
  const [envConfig, setEnvConfig] = useState(getEnv());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    setEnvConfig(getEnv());
  }, []);

  const handleToggleMock = () => {
    const newMockValue = !envConfig.useMock;
    updateEnvConfig({ useMock: newMockValue });
    setEnvConfig(getEnv());
    toast.success(`Mock mode ${newMockValue ? 'enabled' : 'disabled'}. Refresh page to take effect.`);
  };

  const handleRefreshAccounts = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccounts();
      toast.success('Accounts refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh accounts');
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReloadPage = () => {
    window.location.reload();
  };

  const runEmailDiagnostics = async () => {
    setIsRunningTests(true);
    const info: any = {};

    try {
      // Test 1: User Authentication
      info.userAuth = {
        isAuthenticated: !!user,
        userId: user?.id,
        email: user?.email,
        status: user ? 'authenticated' : 'not authenticated'
      };

      // Test 2: Teams Status
      info.teamsStatus = {
        teamsCount: teams.length,
        activeTeam: activeTeam ? { id: activeTeam.id, name: activeTeam.name } : null,
        loading: teamLoading,
        status: teams.length > 0 ? 'teams exist' : 'no teams found'
      };

      // Test 3: Database Connection
      if (user?.id) {
        try {
          const { data: teamMemberships, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', user.id);
            
          info.databaseTest = {
            canConnect: !error,
            error: error?.message,
            membershipCount: teamMemberships?.length || 0,
            status: error ? 'database error' : 'connected'
          };
        } catch (dbError) {
          info.databaseTest = {
            canConnect: false,
            error: dbError instanceof Error ? dbError.message : 'Unknown database error',
            status: 'connection failed'
          };
        }
      }

      // Test 4: Email Accounts
      if (user?.id) {
        try {
          // Get accounts from database directly
          const { data: linkedAccounts } = await supabase
            .from('linked_accounts')
            .select('email, provider')
            .eq('user_id', user.id);
            
          const accounts = linkedAccounts || [];
          info.emailAccounts = {
            accountCount: accounts.length,
            accounts: accounts.map((acc: any) => ({ email: acc.email, provider: acc.provider })),
            status: accounts.length > 0 ? 'accounts configured' : 'no accounts'
          };
        } catch (emailError) {
          info.emailAccounts = {
            accountCount: 0,
            error: emailError instanceof Error ? emailError.message : 'Unknown email error',
            status: 'email service error'
          };
        }
      } else {
        info.emailAccounts = {
          accountCount: 0,
          status: 'no user authenticated'
        };
      }

      // Test 5: Profiles table
      if (user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          info.profileStatus = {
            hasProfile: !!profile,
            profileData: profile ? { full_name: profile.full_name, email: profile.email } : null,
            error: error?.message,
            status: profile ? 'profile exists' : 'no profile'
          };
        } catch (profileError) {
          info.profileStatus = {
            hasProfile: false,
            error: profileError instanceof Error ? profileError.message : 'Unknown profile error',
            status: 'profile error'
          };
        }
      }

    } catch (error) {
      info.generalError = error instanceof Error ? error.message : 'Unknown error';
    }

    setDebugInfo(info);
    setIsRunningTests(false);
  };

  const createDefaultTeam = async () => {
    if (!user?.id) return;
    
    setIsRunningTests(true);
    try {
      console.log('Creating default team for user:', user.id);
      const defaultTeam = await TeamService.createDefaultTeam(user.id);
      console.log('Default team created:', defaultTeam);
      
      // Refresh teams context
      await refreshTeams();
      
      // Re-run diagnostics
      await runEmailDiagnostics();
    } catch (error) {
      console.error('Failed to create default team:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        teamCreationError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
    setIsRunningTests(false);
  };

  const forceRefreshTeams = async () => {
    setIsRunningTests(true);
    try {
      await refreshTeams();
      await runEmailDiagnostics();
    } catch (error) {
      console.error('Failed to refresh teams:', error);
    }
    setIsRunningTests(false);
  };

  useEffect(() => {
    if (user) {
      runEmailDiagnostics();
    }
  }, [user, teams]);

  const getStatusColor = (status: string) => {
    if (status.includes('error') || status.includes('failed') || status === 'no teams found') {
      return 'bg-red-100 text-red-800';
    }
    if (status.includes('authenticated') || status.includes('connected') || status.includes('exist')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('error') || status.includes('failed') || status === 'no teams found') {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (status.includes('authenticated') || status.includes('connected') || status.includes('exist')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <RefreshCw className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email System Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runEmailDiagnostics} 
              disabled={isRunningTests}
              variant="outline"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Run Diagnostics
            </Button>
            
            {debugInfo.teamsStatus?.status === 'no teams found' && (
              <Button 
                onClick={createDefaultTeam} 
                disabled={isRunningTests}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Create Default Team
              </Button>
            )}
            
            <Button 
              onClick={forceRefreshTeams} 
              disabled={isRunningTests}
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Refresh Teams
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(debugInfo).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Authentication Status */}
          {debugInfo.userAuth && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className={getStatusColor(debugInfo.userAuth.status)}>
                  {getStatusIcon(debugInfo.userAuth.status)}
                  <span className="ml-1">{debugInfo.userAuth.status}</span>
                </Badge>
                <div className="text-xs space-y-1">
                  <div>Email: {debugInfo.userAuth.email || 'N/A'}</div>
                  <div>User ID: {debugInfo.userAuth.userId || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teams Status */}
          {debugInfo.teamsStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Teams Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className={getStatusColor(debugInfo.teamsStatus.status)}>
                  {getStatusIcon(debugInfo.teamsStatus.status)}
                  <span className="ml-1">{debugInfo.teamsStatus.status}</span>
                </Badge>
                <div className="text-xs space-y-1">
                  <div>Teams Count: {debugInfo.teamsStatus.teamsCount}</div>
                  <div>Active Team: {debugInfo.teamsStatus.activeTeam?.name || 'None'}</div>
                  <div>Loading: {debugInfo.teamsStatus.loading ? 'Yes' : 'No'}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Connection */}
          {debugInfo.databaseTest && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Database Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className={getStatusColor(debugInfo.databaseTest.status)}>
                  {getStatusIcon(debugInfo.databaseTest.status)}
                  <span className="ml-1">{debugInfo.databaseTest.status}</span>
                </Badge>
                <div className="text-xs space-y-1">
                  <div>Memberships: {debugInfo.databaseTest.membershipCount}</div>
                  {debugInfo.databaseTest.error && (
                    <div className="text-red-600">Error: {debugInfo.databaseTest.error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Accounts */}
          {debugInfo.emailAccounts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Email Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className={getStatusColor(debugInfo.emailAccounts.status)}>
                  {getStatusIcon(debugInfo.emailAccounts.status)}
                  <span className="ml-1">{debugInfo.emailAccounts.status}</span>
                </Badge>
                <div className="text-xs space-y-1">
                  <div>Account Count: {debugInfo.emailAccounts.accountCount}</div>
                  {debugInfo.emailAccounts.accounts?.map((acc: any, i: number) => (
                    <div key={i}>{acc.email} ({acc.provider})</div>
                  ))}
                  {debugInfo.emailAccounts.error && (
                    <div className="text-red-600">Error: {debugInfo.emailAccounts.error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Status */}
          {debugInfo.profileStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profile Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className={getStatusColor(debugInfo.profileStatus.status)}>
                  {getStatusIcon(debugInfo.profileStatus.status)}
                  <span className="ml-1">{debugInfo.profileStatus.status}</span>
                </Badge>
                <div className="text-xs space-y-1">
                  {debugInfo.profileStatus.profileData && (
                    <>
                      <div>Name: {debugInfo.profileStatus.profileData.full_name || 'N/A'}</div>
                      <div>Email: {debugInfo.profileStatus.profileData.email || 'N/A'}</div>
                    </>
                  )}
                  {debugInfo.profileStatus.error && (
                    <div className="text-red-600">Error: {debugInfo.profileStatus.error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {debugInfo.teamCreationError && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-800">Team Creation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600">{debugInfo.teamCreationError}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 