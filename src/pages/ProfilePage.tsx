import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Crown } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { isAuthenticated } from '../services/auth/authService';
import { PageContainer } from '../components/ui/ResponsiveContainer';
import { Spinner } from '../components/ui/Spinner';
import { toast } from 'sonner';
import { useEmail } from '../contexts/EmailContext';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { linkedAccountService } from '../services/account/linkedAccountService';
import { supabase } from '../lib/supabase';
import { useLinkedAccountStore } from '../stores/linkedAccountStore';
import { Badge } from '../components/ui/Badge';
import { ProfileInfoTab } from '../components/profile/ProfileInfoTab';
import { ProfileSubscriptionTab } from '../components/profile/ProfileSubscriptionTab';
import { ProfileEmailAccountsTab } from '../components/profile/ProfileEmailAccountsTab';
import { ProfileUsageStatsTab } from '../components/profile/ProfileUsageStatsTab';

function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    subscription,
    isAuthenticated: isAuth,
    updateProfile,
  } = useUserStore();
  const { refreshAccounts } = useEmail();
  const [isAddingIMAP, setIsAddingIMAP] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { accounts: linkedAccounts, isLoading: isLoadingAccounts, fetchAccounts } = useLinkedAccountStore();

  // Personal Information
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Contact Information
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessEmail, setBusinessEmail] = useState(user?.businessEmail || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [linkedIn, setLinkedIn] = useState(user?.linkedIn || '');
  const [location, setLocation] = useState(user?.location || '');
  const [timezone, setTimezone] = useState(user?.timezone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [preferredCommunication, setPreferredCommunication] = useState(user?.preferredCommunication || '');
  const [skypeId, setSkypeId] = useState(user?.skypeId || '');
  const [teamsId, setTeamsId] = useState(user?.teamsId || '');
  const [slackHandle, setSlackHandle] = useState(user?.slackHandle || '');

  // Business Information
  const [company, setCompany] = useState(user?.company || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [businessRegistration, setBusinessRegistration] = useState(user?.businessRegistration || '');
  const [taxId, setTaxId] = useState(user?.taxId || '');

  // Organization Details
  const [department, setDepartment] = useState(user?.department || '');
  const [team, setTeam] = useState(user?.team || '');
  const [manager, setManager] = useState(user?.manager || '');
  const [officeLocation, setOfficeLocation] = useState(user?.officeLocation || '');
  const [employeeId, setEmployeeId] = useState(user?.employeeId || '');

  const [primaryAccountId, setPrimaryAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (user?.email && linkedAccounts.length > 0) {
      const primaryAccount = linkedAccounts.find((acc) => acc.email === user.email);
      setPrimaryAccountId(primaryAccount ? primaryAccount.id : linkedAccounts[0].id);
    } else {
      setPrimaryAccountId(null);
    }
  }, [user?.email, linkedAccounts]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBusinessEmail(user.businessEmail || '');
      setWebsite(user.website || '');
      setLinkedIn(user.linkedIn || '');
      setLocation(user.location || '');
      setTimezone(user.timezone || '');
      setEmergencyContact(user.emergencyContact || '');
      setPreferredCommunication(user.preferredCommunication || '');
      setSkypeId(user.skypeId || '');
      setTeamsId(user.teamsId || '');
      setSlackHandle(user.slackHandle || '');
      setCompany(user.company || '');
      setJobTitle(user.jobTitle || '');
      setBusinessType(user.businessType || '');
      setBusinessRegistration(user.businessRegistration || '');
      setTaxId(user.taxId || '');
      setDepartment(user.department || '');
      setTeam(user.team || '');
      setManager(user.manager || '');
      setOfficeLocation(user.officeLocation || '');
      setEmployeeId(user.employeeId || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate, isAuth]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = () => {
    if (!subscription) return 'No Subscription';
    const planMap: { [key: string]: string } = {
      free: 'Free Plan',
      pro: 'Pro Plan',
      enterprise: 'Enterprise Plan',
      'enterprise-business': 'Enterprise Business Plan',
    };
    return planMap[subscription.plan] || subscription.plan;
  };

  const getBillingPeriod = () => {
    if (!subscription || subscription.plan === 'free') return '';
    return subscription.type === 'individual' ? 'Monthly Billing' : 'Annual Billing';
  };

  const handleRemoveEmailAccount = useCallback(
    async (accountId: string, accountEmail: string) => {
      try {
        if (accountId === primaryAccountId) {
          toast.error('Cannot remove primary account. Please set another account as primary first.');
          return;
        }
        await linkedAccountService.removeLinkedAccount(accountId);
        await fetchAccounts();
        toast.success(`Successfully removed ${accountEmail}`);
      } catch (error) {
        console.error('Error removing email account:', error);
        toast.error('Failed to remove email account');
      }
    },
    [primaryAccountId, fetchAccounts]
  );

  const handleSetPrimaryAccount = useCallback(async (accountId: string, accountEmail: string) => {
    try {
      setPrimaryAccountId(accountId);
      toast.success(`Set ${accountEmail} as primary account`);
    } catch (error) {
      console.error('Error setting primary account:', error);
      toast.error('Failed to set primary account');
    }
  }, []);

  const handleRefreshAccounts = useCallback(async () => {
    await fetchAccounts();
  }, [fetchAccounts]);

  const handleAddGmail = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/link-callback`,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      toast.error('Failed to start Gmail connection: ' + error.message);
    }
  };

  const handleAddIMAP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailStr = formData.get('email') as string;
    const passwordStr = formData.get('password') as string;
    const imapHostStr = formData.get('imapHost') as string;
    const imapPortNum = Number(formData.get('imapPort') || 993);
    const smtpHostStr = formData.get('smtpHost') as string;
    const smtpPortNum = Number(formData.get('smtpPort') || 587);
    const useSSLToggled = formData.get('useSSL') === 'on';

    if (!emailStr || !passwordStr || !imapHostStr || !smtpHostStr) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsAddingIMAP(true);
      toast.info('Testing connection and connecting IMAP account...');
      await emailServiceAdapter.addIMAPAccount({
        email: emailStr,
        password: passwordStr,
        imapHost: imapHostStr,
        imapPort: imapPortNum,
        smtpHost: smtpHostStr,
        smtpPort: smtpPortNum,
        useSSL: useSSLToggled,
      });
      toast.success('IMAP account connected successfully!');
      e.currentTarget.reset();
      await fetchAccounts();
      await refreshAccounts();
    } catch (error: any) {
      console.error('Failed to add IMAP account:', error);
      toast.error(`Connection failed: ${error.message || error}`);
    } finally {
      setIsAddingIMAP(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        fullName,
        email,
        phone,
        businessEmail,
        website,
        linkedIn,
        location,
        timezone,
        emergencyContact,
        preferredCommunication,
        skypeId,
        teamsId,
        slackHandle,
        company,
        jobTitle,
        businessType,
        businessRegistration,
        taxId,
        department,
        team,
        manager,
        officeLocation,
        employeeId,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile.');
      console.error('Update profile error:', error);
    }
  };

  const handleRefreshGoogleAvatar = async () => {
    try {
      setIsSyncing(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const pic =
        session?.user?.user_metadata?.picture ||
        session?.user?.user_metadata?.avatar_url ||
        (session?.user as any)?.identities?.[0]?.identity_data?.picture ||
        (session?.user as any)?.identities?.[0]?.identity_data?.avatar_url;

      if (pic) {
        localStorage.setItem('genieflow_user_avatar', pic);
        updateProfile({ avatar: pic });
        toast.success('Google profile photo synced successfully!');
      } else {
        toast.info('No Google photo found on your active session.');
      }
    } catch (error) {
      console.error('Google avatar refresh error:', error);
      toast.error('Could not sync Google photo');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8 mr-2" />
        <span>Loading your profile...</span>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {getPlanName()}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription" className="relative">
            <Crown className="h-4 w-4 mr-1" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="email" className="relative">
            Email Accounts
            {linkedAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {linkedAccounts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usage">Automation Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileInfoTab
            user={user}
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            businessEmail={businessEmail}
            setBusinessEmail={setBusinessEmail}
            website={website}
            setWebsite={setWebsite}
            linkedIn={linkedIn}
            setLinkedIn={setLinkedIn}
            location={location}
            setLocation={setLocation}
            timezone={timezone}
            setTimezone={setTimezone}
            emergencyContact={emergencyContact}
            setEmergencyContact={setEmergencyContact}
            preferredCommunication={preferredCommunication}
            setPreferredCommunication={setPreferredCommunication}
            skypeId={skypeId}
            setSkypeId={setSkypeId}
            teamsId={teamsId}
            setTeamsId={setTeamsId}
            slackHandle={slackHandle}
            setSlackHandle={setSlackHandle}
            company={company}
            setCompany={setCompany}
            jobTitle={jobTitle}
            setJobTitle={setJobTitle}
            businessType={businessType}
            setBusinessType={setBusinessType}
            businessRegistration={businessRegistration}
            setBusinessRegistration={setBusinessRegistration}
            taxId={taxId}
            setTaxId={setTaxId}
            department={department}
            setDepartment={setDepartment}
            team={team}
            setTeam={setTeam}
            manager={manager}
            setManager={setManager}
            officeLocation={officeLocation}
            setOfficeLocation={setOfficeLocation}
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            isSyncing={isSyncing}
            onUpdateProfile={handleUpdateProfile}
            onRefreshGoogleAvatar={handleRefreshGoogleAvatar}
            onUpdateAvatar={(avatarUrl) => updateProfile({ avatar: avatarUrl })}
          />
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <ProfileSubscriptionTab
            subscription={subscription}
            planName={getPlanName()}
            billingPeriod={getBillingPeriod()}
            formatDate={formatDate}
            onNavigateSubscription={() => navigate('/subscription')}
            onNavigateAutomation={() => navigate('/automation')}
            onNavigateAgents={() => navigate('/agents')}
          />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <ProfileEmailAccountsTab
            primaryAccountId={primaryAccountId}
            linkedAccounts={linkedAccounts}
            isLoadingAccounts={isLoadingAccounts}
            isAddingIMAP={isAddingIMAP}
            formatDate={formatDate}
            onRefreshAccounts={handleRefreshAccounts}
            onSetPrimaryAccount={handleSetPrimaryAccount}
            onRemoveEmailAccount={handleRemoveEmailAccount}
            onAddGmail={handleAddGmail}
            onAddIMAP={handleAddIMAP}
          />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <ProfileUsageStatsTab
            subscription={subscription}
            onNavigateAgents={() => navigate('/agents')}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export default ProfilePage;