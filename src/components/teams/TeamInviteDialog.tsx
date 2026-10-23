/**
 * 🎨 Beautiful Team Invite Dialog - Modern Glassmorphism Design
 * 
 * A stunning invitation dialog component with:
 * - Glassmorphism effects and backdrop blur
 * - Beautiful gradients and animations
 * - Comprehensive form validation
 * - Accessibility-first design
 * - Production-ready error handling
 * 
 * @version 2.0.0
 * @author GenieFlow AI Team
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import {
  Mail,
  Send,
  Shield,
  User,
  UserPlus,
  Info,
  AlertCircle,
  Sparkles,
  Crown,
  Users,
  Eye,
  Loader2,
  CheckCircle2,
  Copy,
  Link,
  Zap
} from 'lucide-react';

interface TeamInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onInvite: (inviteData: {
    email: string;
    role: 'admin' | 'member' | 'guest';
    message?: string;
  }) => Promise<void>;
}

/**
 * Role Information Cards
 */
const roleInfo = {
  admin: {
    icon: Crown,
    title: 'Admin',
    description: 'Can manage team settings, channels, and members',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    permissions: ['Manage channels', 'Invite/remove members', 'Access all channels', 'Team settings']
  },
  member: {
    icon: User,
    title: 'Member',
    description: 'Can participate in channels and discussions',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    permissions: ['Join public channels', 'Send messages', 'Create channels', 'Basic team access']
  },
  guest: {
    icon: Eye,
    title: 'Guest',
    description: 'Limited access to specific channels only',
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    borderColor: 'border-slate-200 dark:border-slate-800',
    permissions: ['Limited channel access', 'Read-only by default', 'No team settings', 'Temporary access']
  }
};

/**
 * Beautiful Role Selection Card
 */
interface RoleCardProps {
  roleKey: keyof typeof roleInfo;
  selected: boolean;
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ roleKey, selected, onClick }) => {
  const role = roleInfo[roleKey];
  const IconComponent = role.icon;
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
        selected 
          ? `${role.bgColor} ${role.borderColor} shadow-lg ring-2 ring-primary-500/20` 
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center shadow-md`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>{role.title}</span>
              {selected && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {role.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {role.permissions.slice(0, 2).map((permission, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
              {role.permissions.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{role.permissions.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TeamInviteDialog({
  open,
  onOpenChange,
  teamName,
  onInvite
}: TeamInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    role?: string;
    general?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validation
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!role) {
      newErrors.role = 'Please select a role';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await onInvite({
        email: email.trim(),
        role,
        message: message.trim() || undefined
      });
      
      // Show success state
      setShowSuccess(true);
      setInviteLink(`https://genieflow.ai/teams/invite/abc123`); // Mock invite link
      
      // Reset form after delay
      setTimeout(() => {
        setEmail('');
        setRole('member');
        setMessage('');
        setShowSuccess(false);
        setInviteLink('');
        onOpenChange(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to send invitation. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setRole('member');
    setMessage('');
    setErrors({});
    setShowSuccess(false);
    setInviteLink('');
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy invite link:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        {showSuccess ? (
          // Success State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Invitation Sent! 🎉
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 mb-6">
              We've sent an invitation to <strong>{email}</strong> to join <strong>{teamName}</strong> as a {role}.
            </DialogDescription>
            
            {inviteLink && (
              <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between space-x-3">
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Invite Link
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {inviteLink}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInviteLink}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Main Form
          <>
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Invite Team Member
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    Invite someone to join <strong>{teamName}</strong> and start collaborating
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {errors.general && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {errors.general}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="colleague@company.com"
                    className={`pl-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-400'
                    }`}
                    disabled={loading}
                    autoFocus
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Role
                </Label>
                <div className="grid gap-3">
                  {(Object.keys(roleInfo) as Array<keyof typeof roleInfo>).map((roleKey) => (
                    <RoleCard
                      key={roleKey}
                      roleKey={roleKey}
                      selected={role === roleKey}
                      onClick={() => setRole(roleKey)}
                    />
                  ))}
                </div>
                {errors.role && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.role}</span>
                  </p>
                )}
              </div>

              {/* Personal Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Personal Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi! I'd like to invite you to join our ${teamName} team on GenieFlow. Looking forward to collaborating with you!`}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-400 min-h-[100px]"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add a personal touch to your invitation
                </p>
              </div>

              {/* Invite Preview */}
              {email && role && (
                <Card className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-primary-500" />
                      <span>Invitation Preview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary-400 to-blue-500 text-white">
                          {email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {email}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${roleInfo[role].bgColor} ${roleInfo[role].borderColor}`}
                          >
                            {roleInfo[role].title}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            will join {teamName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>

            <DialogFooter className="flex items-center justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleReset();
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !email.trim() || !role}
                  className="bg-gradient-to-r from-primary-500 to-blue-600 hover:from-primary-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}