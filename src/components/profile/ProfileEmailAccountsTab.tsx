import React from 'react';
import {
  Star,
  Chrome,
  RefreshCw,
  MoreVertical,
  Trash2,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { LinkedAccount } from '../../stores/linkedAccountStore';

interface ProfileEmailAccountsTabProps {
  primaryAccountId: string | null;
  linkedAccounts: LinkedAccount[];
  isLoadingAccounts: boolean;
  isAddingIMAP: boolean;
  formatDate: (dateStr: string) => string;
  onRefreshAccounts: () => void;
  onSetPrimaryAccount: (accountId: string, accountEmail: string) => void;
  onRemoveEmailAccount: (accountId: string, accountEmail: string) => void;
  onAddGmail: () => void;
  onAddIMAP: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const ProfileEmailAccountsTab: React.FC<ProfileEmailAccountsTabProps> = ({
  primaryAccountId,
  linkedAccounts,
  isLoadingAccounts,
  isAddingIMAP,
  formatDate,
  onRefreshAccounts,
  onSetPrimaryAccount,
  onRemoveEmailAccount,
  onAddGmail,
  onAddIMAP,
}) => {
  const getAccountStatus = (_account: LinkedAccount) => {
    return 'connected';
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'syncing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getAccountStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'syncing':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const primaryAccount = linkedAccounts.find((acc) => acc.id === primaryAccountId);

  return (
    <div className="grid gap-6">
      {/* Primary Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Primary Account
          </CardTitle>
          <CardDescription>
            Your primary account is used for login and administrative functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {primaryAccountId && linkedAccounts.length > 0 && primaryAccount ? (
            <div className="flex items-center justify-between p-4 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Chrome className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{primaryAccount.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connected {formatDate(primaryAccount.created_at)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Primary
                </Badge>
                <Badge className={getAccountStatusColor(getAccountStatus(primaryAccount))}>
                  {getAccountStatusIcon(getAccountStatus(primaryAccount))}
                  <span className="ml-1 capitalize">{getAccountStatus(primaryAccount)}</span>
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No primary account set</div>
          )}
        </CardContent>
      </Card>

      {/* All Email Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Email Accounts</CardTitle>
              <CardDescription>Manage all your connected email accounts</CardDescription>
            </div>
            <Button onClick={onRefreshAccounts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAccounts ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : linkedAccounts.length > 0 ? (
            <div className="space-y-3">
              {linkedAccounts.map((account) => {
                const isPrimary = account.id === primaryAccountId;
                const status = getAccountStatus(account);

                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <Chrome className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.email}</p>
                          {isPrimary && <Star className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="capitalize">{account.provider}</span>
                          <span>•</span>
                          <span>Added {formatDate(account.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getAccountStatusColor(status)}>
                        {getAccountStatusIcon(status)}
                        <span className="ml-1 capitalize">{status}</span>
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isPrimary && (
                            <DropdownMenuItem
                              onClick={() => onSetPrimaryAccount(account.id, account.email)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set as Primary
                            </DropdownMenuItem>
                          )}
                          {!isPrimary && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Account
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Remove Email Account</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to remove {account.email}? This will
                                    disconnect the account.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    onClick={() =>
                                      onRemoveEmailAccount(account.id, account.email)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove Account
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No email accounts connected
              </h3>
              <p className="text-gray-500 mb-4">Connect your first email account to get started</p>
            </div>
          )}

          {/* Add Account Section */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Add New Account</h3>
            <div className="grid gap-4">
              <Button onClick={onAddGmail} className="flex items-center gap-2" variant="outline">
                <Chrome className="h-5 w-5" />
                Add Gmail Account
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or add IMAP account
                  </span>
                </div>
              </div>

              <form onSubmit={onAddIMAP} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="imapHost">IMAP Server</Label>
                    <Input
                      id="imapHost"
                      name="imapHost"
                      required
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imapPort">IMAP Port</Label>
                    <Input
                      id="imapPort"
                      name="imapPort"
                      type="number"
                      defaultValue={993}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="smtpHost">SMTP Server</Label>
                    <Input
                      id="smtpHost"
                      name="smtpHost"
                      required
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      name="smtpPort"
                      type="number"
                      defaultValue={587}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="useSSL"
                    name="useSSL"
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <Label htmlFor="useSSL" className="text-sm font-normal">
                    Use SSL/TLS secure connection
                  </Label>
                </div>
                <Button type="submit" disabled={isAddingIMAP} className="w-full">
                  {isAddingIMAP ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      Connecting IMAP...
                    </div>
                  ) : (
                    'Connect IMAP Account'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
