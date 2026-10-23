import { supabase } from '../../lib/supabase';
import { EmailService } from '../email/emailService';

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  team_name?: string;
  inviter_name?: string;
}

export interface InviteTeamMemberData {
  email: string;
  role: 'admin' | 'member' | 'guest';
  message?: string;
}

export class TeamInvitationService {
  private static emailService = EmailService.getInstance();

  /**
   * Send a team invitation via email
   */
  static async inviteTeamMember(
    teamId: string,
    teamName: string,
    inviterName: string,
    inviteData: InviteTeamMemberData
  ): Promise<TeamInvitation> {
    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('email', inviteData.email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      throw new Error('Invitation already sent to this email address');
    }

    // Generate secure token for invitation
    const token = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Get current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        inviter_id: user.id,
        email: inviteData.email,
        role: inviteData.role,
        status: 'pending',
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error('Failed to create invitation');
    }

    // Send invitation email
    try {
      await this.sendInvitationEmail({
        email: inviteData.email,
        teamName,
        inviterName,
        role: inviteData.role,
        token,
        customMessage: inviteData.message
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't throw here - invitation is created, email failed
      // In production, you might want to queue for retry
    }

    return {
      ...invitation,
      team_name: teamName,
      inviter_name: inviterName
    };
  }

  /**
   * Get pending invitations for a team
   */
  static async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams:team_id(name),
        profiles:inviter_id(full_name)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team invitations:', error);
      throw new Error('Failed to fetch invitations');
    }

    type SupabaseInvitation = (typeof invitations)[number] & {
      teams: { name: string } | null;
      profiles: { full_name: string } | null;
    };

    return invitations.map((inv: SupabaseInvitation) => ({
      ...inv,
      team_name: inv.teams?.name,
      inviter_name: inv.profiles?.full_name
    }));
  }

  /**
   * Accept a team invitation
   */
  static async acceptInvitation(token: string): Promise<void> {
    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      throw new Error('Invitation has expired');
    }

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      throw new Error('This invitation is for a different email address');
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role
      });

    if (memberError) {
      console.error('Error adding team member:', memberError);
      throw new Error('Failed to join team');
    }

    // Update invitation status
    await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);
  }

  /**
   * Reject a team invitation
   */
  static async rejectInvitation(token: string): Promise<void> {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'rejected' })
      .eq('token', token)
      .eq('status', 'pending');

    if (error) {
      console.error('Error rejecting invitation:', error);
      throw new Error('Failed to reject invitation');
    }
  }

  /**
   * Cancel/revoke a team invitation
   */
  static async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error revoking invitation:', error);
      throw new Error('Failed to revoke invitation');
    }
  }

  /**
   * Resend a team invitation
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams:team_id(name),
        profiles:inviter_id(full_name)
      `)
      .eq('id', invitationId)
      .single();

    if (error || !invitation) {
      throw new Error('Invitation not found');
    }

    // Generate new token and extend expiry
    const newToken = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invitation
    await supabase
      .from('team_invitations')
      .update({
        token: newToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .eq('id', invitationId);

    // Resend email
    await this.sendInvitationEmail({
      email: invitation.email,
      teamName: invitation.teams?.name || 'Team',
      inviterName: invitation.profiles?.full_name || 'Someone',
      role: invitation.role,
      token: newToken
    });
  }

  /**
   * Send invitation email
   */
  private static async sendInvitationEmail(data: {
    email: string;
    teamName: string;
    inviterName: string;
    role: string;
    token: string;
    customMessage?: string;
  }): Promise<void> {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/teams/invite?token=${data.token}`;

    const emailSubject = `${data.inviterName} invited you to join ${data.teamName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">You're invited to join a team!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">
            <strong>${data.inviterName}</strong> has invited you to join the <strong>${data.teamName}</strong> team.
          </p>
          <p style="margin: 0; color: #666;">
            You'll be joining as a <strong>${data.role}</strong>.
          </p>
        </div>

        ${data.customMessage ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Personal message:</h3>
            <p style="font-style: italic; color: #555; background: #f0f0f0; padding: 15px; border-radius: 5px;">
              "${data.customMessage}"
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            This invitation will expire in 7 days. If you don't want to join this team, you can simply ignore this email.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            If the button doesn't work, copy and paste this link: ${inviteUrl}
          </p>
        </div>
      </div>
    `;

    await this.emailService.sendMessage({
      to: data.email,
      subject: emailSubject,
      body: emailBody
    });
  }

  /**
   * Generate a secure invitation token
   */
  private static generateInvitationToken(): string {
    // Generate a secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get invitation by token (for accepting/rejecting)
   */
  static async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams:team_id(name),
        profiles:inviter_id(full_name)
      `)
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error fetching invitation:', error);
      return null;
    }

    return {
      ...invitation,
      team_name: invitation.teams?.name,
      inviter_name: invitation.profiles?.full_name
    };
  }
} 