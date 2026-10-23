import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Shield,
  User
} from 'lucide-react';
import { TeamInvitationService, TeamInvitation } from '../services/team/teamInvitationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

function TeamInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const fetchInvitation = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const inviteData = await TeamInvitationService.getInvitationByToken(token);
      
      if (!inviteData) {
        setError('Invitation not found or has expired');
        return;
      }

      if (inviteData.status !== 'pending') {
        setError(`This invitation has already been ${inviteData.status}.`);
        setInvitation(inviteData); // Still set invitation to show details
        return;
      }

      // Check if invitation is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invitation has expired.');
        // Optionally update status on the backend here if desired
        return;
      }

      setInvitation(inviteData);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token, fetchInvitation]);

  const handleAcceptInvitation = async () => {
    if (!token || !invitation || !user) return;

    try {
      setProcessing(true);
      await TeamInvitationService.acceptInvitation(token);
      
      toast.success(`Successfully joined ${invitation.team_name}!`);
      
      // Redirect to teams page after successful acceptance
      setTimeout(() => {
        navigate('/teams');
      }, 2000);
      
    } catch (err) {
      const error = err as Error;
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!token) return;

    try {
      setProcessing(true);
      await TeamInvitationService.rejectInvitation(token);
      
      toast.success('Invitation declined');
      
      // Redirect after rejection
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      const error = err as Error;
      console.error('Error rejecting invitation:', error);
      toast.error(error.message || 'Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member': return <User className="h-4 w-4 text-gray-500" />;
      case 'guest': return <User className="h-4 w-4 text-gray-400" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'member': return 'secondary';
      case 'guest': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or malformed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Spinner className="h-8 w-8 mb-4" />
            <p className="text-muted-foreground">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-orange-600">Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
            {token && (
              <Button onClick={fetchInvitation} variant="ghost" size="sm">
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserPlus className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to accept this team invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
            <Button onClick={() => navigate('/signup')} variant="outline" className="w-full">
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation could not be found or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user email matches invitation email
  const emailMismatch = user.email !== invitation.email;

  if (emailMismatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-orange-600">Email Mismatch</CardTitle>
            <CardDescription>
              This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re signed in as <strong>{user.email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Please sign in with the correct email address or contact the person who invited you.
            </p>
            <Button onClick={() => navigate('/login')} variant="outline">
              Sign In with Different Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
          <CardDescription>
            {invitation.inviter_name} has invited you to join their team
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Team Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {invitation.team_name?.substring(0, 2).toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{invitation.team_name}</h3>
                <p className="text-sm text-muted-foreground">Team collaboration workspace</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Your role:</span>
                <div className="flex items-center gap-1">
                  {getRoleIcon(invitation.role)}
                  <Badge variant={getRoleBadgeVariant(invitation.role)}>
                    {invitation.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Invited to: {invitation.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Sent: {formatDate(invitation.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Expires: {formatDate(invitation.expires_at)}</span>
            </div>
          </div>

          {/* Role Explanation */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">About the {invitation.role} role:</h4>
            <p className="text-sm text-blue-800">
              {invitation.role === 'admin' && 'You&apos;ll be able to manage team settings, invite members, and moderate channels.'}
              {invitation.role === 'member' && 'You&apos;ll have full access to team channels and can participate in discussions.'}
              {invitation.role === 'guest' && 'You&apos;ll have limited access to specific channels and discussions.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleAcceptInvitation}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Joining Team...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleRejectInvitation}
              disabled={processing}
              variant="outline"
              className="w-full"
            >
              {processing ? (
                'Processing...'
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline Invitation
                </>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By accepting this invitation, you agree to collaborate respectfully with your team members.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TeamInvitePage; 