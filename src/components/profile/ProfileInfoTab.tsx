import React, { useRef } from 'react';
import { User, Phone, Building, Network, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { getSafeAvatarUrl } from '../../lib/utils';
import { toast } from 'sonner';

interface ProfileInfoTabProps {
  user: any;
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  businessEmail: string;
  setBusinessEmail: (val: string) => void;
  website: string;
  setWebsite: (val: string) => void;
  linkedIn: string;
  setLinkedIn: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  emergencyContact: string;
  setEmergencyContact: (val: string) => void;
  preferredCommunication: string;
  setPreferredCommunication: (val: string) => void;
  skypeId: string;
  setSkypeId: (val: string) => void;
  teamsId: string;
  setTeamsId: (val: string) => void;
  slackHandle: string;
  setSlackHandle: (val: string) => void;
  company: string;
  setCompany: (val: string) => void;
  jobTitle: string;
  setJobTitle: (val: string) => void;
  businessType: string;
  setBusinessType: (val: string) => void;
  businessRegistration: string;
  setBusinessRegistration: (val: string) => void;
  taxId: string;
  setTaxId: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  team: string;
  setTeam: (val: string) => void;
  manager: string;
  setManager: (val: string) => void;
  officeLocation: string;
  setOfficeLocation: (val: string) => void;
  employeeId: string;
  setEmployeeId: (val: string) => void;
  isSyncing: boolean;
  onUpdateProfile: () => void;
  onRefreshGoogleAvatar: () => void;
  onUpdateAvatar: (avatarUrl: string) => void;
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  user,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  businessEmail,
  setBusinessEmail,
  website,
  setWebsite,
  linkedIn,
  setLinkedIn,
  location,
  setLocation,
  timezone,
  setTimezone,
  emergencyContact,
  setEmergencyContact,
  preferredCommunication,
  setPreferredCommunication,
  skypeId,
  setSkypeId,
  teamsId,
  setTeamsId,
  slackHandle,
  setSlackHandle,
  company,
  setCompany,
  jobTitle,
  setJobTitle,
  businessType,
  setBusinessType,
  businessRegistration,
  setBusinessRegistration,
  taxId,
  setTaxId,
  department,
  setDepartment,
  team,
  setTeam,
  manager,
  setManager,
  officeLocation,
  setOfficeLocation,
  employeeId,
  setEmployeeId,
  isSyncing,
  onUpdateProfile,
  onRefreshGoogleAvatar,
  onUpdateAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem('genieflow_user_avatar', dataUrl);
      onUpdateAvatar(dataUrl);
      toast.success('Profile photo updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Personal Information
          </CardTitle>
          <CardDescription>Your basic profile information and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <img
                src={getSafeAvatarUrl(user?.avatar, user?.fullName || 'User')}
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            </Avatar>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Change Avatar
                </Button>
                <Button
                  variant="outline"
                  onClick={onRefreshGoogleAvatar}
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  {isSyncing ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                  Sync Google Photo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload custom avatar or sync from Google account
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Primary Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Primary email is your login email and cannot be changed.
          </p>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-500" />
            Enterprise Contact Information
          </CardTitle>
          <CardDescription>
            Professional communication channels and preferences for enterprise collaboration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                Primary Contact Details
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder="john@company.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Name: +1 (555) 987-6543"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">UTC-8 (Pacific Standard)</SelectItem>
                      <SelectItem value="UTC-7">UTC-7 (Mountain)</SelectItem>
                      <SelectItem value="UTC-6">UTC-6 (Central)</SelectItem>
                      <SelectItem value="UTC-5">UTC-5 (Eastern)</SelectItem>
                      <SelectItem value="UTC+0">UTC+0 (GMT/London)</SelectItem>
                      <SelectItem value="UTC+1">UTC+1 (Central Europe)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                Enterprise Communication Platforms
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="teamsId">Microsoft Teams ID</Label>
                  <Input
                    id="teamsId"
                    placeholder="user@company.com"
                    value={teamsId}
                    onChange={(e) => setTeamsId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slackHandle">Slack Handle</Label>
                  <Input
                    id="slackHandle"
                    placeholder="@username"
                    value={slackHandle}
                    onChange={(e) => setSlackHandle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="skypeId">Skype ID</Label>
                  <Input
                    id="skypeId"
                    placeholder="live:username"
                    value={skypeId}
                    onChange={(e) => setSkypeId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preferredCommunication">Preferred Communication Method</Label>
                  <Select value={preferredCommunication} onValueChange={setPreferredCommunication}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="video-call">Video Conference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                Professional Web Presence
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="website">Professional Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                  <Input
                    id="linkedIn"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="location">Business Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-500" />
            Enterprise Business Information
          </CardTitle>
          <CardDescription>
            Comprehensive business details for cross-industry automation and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Core Business Details</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Your Company Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jobTitle">Job Title / Role</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Senior Partner, Chief Legal Officer, etc."
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="businessRegistration">Business Registration Number</Label>
                  <Input
                    id="businessRegistration"
                    placeholder="EIN, Corp ID, or Registration Number"
                    value={businessRegistration}
                    onChange={(e) => setBusinessRegistration(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    placeholder="Tax identification number"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Business Structure</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="businessType">Business Structure</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                      <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="professional-corporation">Professional Corporation (PC)</SelectItem>
                      <SelectItem value="nonprofit">Non-profit Organization</SelectItem>
                      <SelectItem value="government">Government Agency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-orange-500" />
            Organization Details
          </CardTitle>
          <CardDescription>Internal organization and team information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                placeholder="Product Development"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                placeholder="Manager's Name"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder="EMP001234"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="officeLocation">Office Location</Label>
              <Input
                id="officeLocation"
                placeholder="Building A, Floor 3, Desk 42"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={onUpdateProfile} className="min-w-32">
          <CheckCircle className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
};
