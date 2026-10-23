// Beta User Outreach System - Target 100 Legal & Medical Professionals
// Exclusive access invitation system with profession-specific targeting

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Mail, User, Building, Award, Send, CheckCircle, 
  Clock, Target, TrendingUp, Shield, Star, Phone
} from 'lucide-react';

export interface BetaInvite {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profession: string;
  specialty: string;
  company: string;
  phone?: string;
  linkedin_url?: string;
  years_experience: number;
  current_tools: string[];
  pain_points: string[];
  invitation_sent: boolean;
  response_status: 'pending' | 'accepted' | 'declined' | 'expired';
  demo_scheduled: boolean;
  notes: string;
  priority_score: number; // 1-100 based on profile quality
  referral_source: string;
  created_at: string;
  invited_at?: string;
  responded_at?: string;
}

export interface OutreachCampaign {
  id: string;
  name: string;
  profession_target: string;
  email_template: string;
  subject_line: string;
  total_sent: number;
  total_responses: number;
  conversion_rate: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
}

const PROFESSION_TARGETS = [
  {
    id: 'attorneys',
    name: 'Attorneys & Legal Professionals',
    icon: '⚖️',
    specialties: [
      'Workers Compensation',
      'Personal Injury',
      'Corporate Law',
      'Family Law',
      'Criminal Defense',
      'Immigration',
      'Real Estate Law',
      'Employment Law'
    ],
    target_count: 50,
    value_props: [
      'Generate demand letters in 30 seconds',
      'Automate QME report analysis',
      'Voice-to-document legal briefs',
      'Streamline case documentation',
      'Reduce billing hours on routine tasks'
    ]
  },
  {
    id: 'medical',
    name: 'Medical Professionals',
    icon: '🏥',
    specialties: [
      'Orthopedic Surgery',
      'Internal Medicine',
      'Occupational Medicine',
      'Physical Medicine',
      'Pain Management',
      'Psychiatry',
      'Emergency Medicine',
      'Family Practice'
    ],
    target_count: 50,
    value_props: [
      'Create IME reports with voice commands',
      'Automate disability assessments',
      'Generate treatment summaries',
      'Voice-dictated medical letters',
      'Streamline peer review reports'
    ]
  }
];

const EMAIL_TEMPLATES = {
  legal_initial: {
    subject: "🚀 Beta Access: AI Voice-to-Document for Legal Professionals",
    template: `Hi {{first_name}},

I hope this email finds you well. I'm reaching out because you're exactly the type of legal professional we built GenieFlow AI for.

**What if you could create a demand letter in 30 seconds using just your voice?**

We've developed an AI system that transforms voice commands into professional legal documents:

✅ "Draft demand letter for rear-end collision, $5,000 damages" → Complete demand letter
✅ "Create QME report for lumbar spine injury" → Medical-legal evaluation  
✅ "Generate settlement demand for work comp case" → Professional negotiation letter

**Why I'm reaching out to you:**
- You're a {{specialty}} attorney with {{years_experience}}+ years experience
- You understand the time drain of routine document creation
- You're likely spending 2-3 hours on documents that could take 30 seconds

**Exclusive Beta Invitation:**
We're inviting just 50 legal professionals to test GenieFlow AI before our public launch. 

**What you get:**
- Free 30-day access (normally $97/month)
- 1-on-1 onboarding session
- Direct line to our development team
- Voice template customization for your practice areas

**5-minute demo this week?**
I'd love to show you how {{first_name}} from a similar {{specialty}} practice saved 15 hours/week using voice-to-document automation.

Available Tuesday-Thursday 2-4 PM PST for a quick screen share.

Best regards,
Sarah Chen
Founder, GenieFlow AI
sarah@genieflowai.com
(555) 123-4567

P.S. We're specifically looking for feedback from {{specialty}} attorneys. Your insights would be invaluable.`
  },
  medical_initial: {
    subject: "🏥 Beta Invite: AI Voice-to-Report for Medical Professionals",
    template: `Hi Dr. {{last_name}},

As a {{specialty}} physician with {{years_experience}} years of experience, you know how time-consuming medical reports can be.

**What if you could complete an IME report in 45 seconds using just your voice?**

GenieFlow AI transforms voice commands into professional medical documentation:

✅ "Create IME report for rotator cuff tear, recommend surgery" → Complete evaluation
✅ "Generate disability assessment for chronic pain patient" → Detailed report
✅ "Draft treatment summary for work injury case" → Professional documentation

**Why you're perfect for our beta:**
- {{specialty}} expertise in high-demand area
- {{years_experience}}+ years creating medical reports
- Understanding of time pressures in medical practice

**Exclusive Beta Access:**
We're selecting just 50 medical professionals for early access.

**Beta Benefits:**
- Free 30-day access (normally $147/month)
- Personalized voice template setup
- Priority feature requests
- Direct developer feedback channel

**Quick 10-minute demo?**
I can show you how Dr. Rodriguez (Orthopedic Surgery) reduced report time from 45 minutes to 2 minutes using voice commands.

Available for brief calls Tuesday-Thursday afternoons.

Best regards,
Dr. Michael Kim, MD
Medical Advisor, GenieFlow AI
michael@genieflowai.com
(555) 123-4567

P.S. Your feedback as a {{specialty}} specialist would be incredibly valuable for our medical AI development.`
  }
};

// Beta Invite Form Component
const BetaInviteForm: React.FC<{
  onSubmit: (invite: Partial<BetaInvite>) => void;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<BetaInvite>>({
    profession: 'legal',
    current_tools: [],
    pain_points: [],
    years_experience: 5,
    priority_score: 50
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate priority score based on profile quality
    let score = 50;
    if (formData.years_experience! >= 10) score += 20;
    if (formData.years_experience! >= 20) score += 10;
    if (formData.linkedin_url) score += 15;
    if (formData.specialty) score += 10;
    if (formData.current_tools && formData.current_tools.length > 0) score += 5;
    
    onSubmit({
      ...formData,
      priority_score: Math.min(100, score),
      created_at: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Beta Prospect</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.first_name || ''}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.last_name || ''}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profession *
            </label>
            <select
              required
              value={formData.profession}
              onChange={(e) => setFormData({...formData, profession: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="legal">Legal Professional</option>
              <option value="medical">Medical Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialty
            </label>
            <input
              type="text"
              value={formData.specialty || ''}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              placeholder="e.g., Workers Compensation, Orthopedic Surgery"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company/Practice
            </label>
            <input
              type="text"
              value={formData.company || ''}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years Experience
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.years_experience}
              onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL (increases priority)
          </label>
          <input
            type="url"
            value={formData.linkedin_url || ''}
            onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Tools (comma-separated)
          </label>
          <input
            type="text"
            value={formData.current_tools?.join(', ') || ''}
            onChange={(e) => setFormData({
              ...formData, 
              current_tools: e.target.value.split(',').map(t => t.trim()).filter(t => t)
            })}
            placeholder="Word, Clio, Dragon, Epic, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes/Referral Source
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            placeholder="How did you find this prospect? Any special notes?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add to Beta List
        </button>
      </form>
    </div>
  );
};

// Beta Prospect List Component
const BetaProspectList: React.FC<{
  prospects: BetaInvite[];
  onSendInvite: (prospect: BetaInvite) => void;
  onBulkInvite: (prospects: BetaInvite[]) => void;
}> = ({ prospects, onSendInvite, onBulkInvite }) => {
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'created' | 'experience'>('priority');

  // Filter and sort prospects
  const filteredProspects = prospects
    .filter(p => filter === 'all' || p.response_status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority': return b.priority_score - a.priority_score;
        case 'experience': return b.years_experience - a.years_experience;
        case 'created': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

  const toggleSelection = (prospectId: string) => {
    setSelectedProspects(prev => 
      prev.includes(prospectId) 
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const handleBulkInvite = () => {
    const selected = prospects.filter(p => selectedProspects.includes(p.id));
    onBulkInvite(selected);
    setSelectedProspects([]);
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Beta Prospects ({prospects.length})
          </h3>
          
          {selectedProspects.length > 0 && (
            <button
              onClick={handleBulkInvite}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send {selectedProspects.length} Invites</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prospects</option>
              <option value="pending">Pending Response</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Priority Score</option>
              <option value="experience">Experience</option>
              <option value="created">Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prospect List */}
      <div className="divide-y divide-gray-200">
        {filteredProspects.map((prospect) => (
          <div key={prospect.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedProspects.includes(prospect.id)}
                onChange={() => toggleSelection(prospect.id)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />

              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {prospect.first_name.charAt(0)}{prospect.last_name.charAt(0)}
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {prospect.first_name} {prospect.last_name}
                    </h4>
                    <p className="text-gray-600">
                      {prospect.specialty || prospect.profession} • {prospect.years_experience} years
                    </p>
                    {prospect.company && (
                      <p className="text-gray-500">{prospect.company}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Priority Score */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(prospect.priority_score)}`}>
                      Priority: {prospect.priority_score}
                    </span>

                    {/* Status */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prospect.response_status)}`}>
                      {prospect.response_status}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{prospect.email}</span>
                  </span>
                  {prospect.phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{prospect.phone}</span>
                    </span>
                  )}
                  {prospect.linkedin_url && (
                    <a 
                      href={prospect.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>

                {/* Tools & Notes */}
                {(prospect.current_tools?.length > 0 || prospect.notes) && (
                  <div className="mt-3 space-y-1">
                    {prospect.current_tools?.length > 0 && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tools:</span> {prospect.current_tools.join(', ')}
                      </p>
                    )}
                    {prospect.notes && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {prospect.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center space-x-3">
                  {!prospect.invitation_sent ? (
                    <button
                      onClick={() => onSendInvite(prospect)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Invite</span>
                    </button>
                  ) : (
                    <span className="text-green-600 text-sm flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Invited {prospect.invited_at && new Date(prospect.invited_at).toLocaleDateString()}</span>
                    </span>
                  )}

                  {prospect.response_status === 'accepted' && !prospect.demo_scheduled && (
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                      Schedule Demo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProspects.length === 0 && (
        <div className="p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
          <p className="text-gray-600">Add prospects or adjust your filters.</p>
        </div>
      )}
    </div>
  );
};

// Main Beta Outreach Component
export const BetaUserOutreach: React.FC = () => {
  const [prospects, setProspects] = useState<BetaInvite[]>([]);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'prospects' | 'campaigns'>('overview');

  // Add new prospect
  const handleAddProspect = async (prospectData: Partial<BetaInvite>) => {
    const newProspect: BetaInvite = {
      id: `prospect-${Date.now()}`,
      email: prospectData.email!,
      first_name: prospectData.first_name!,
      last_name: prospectData.last_name!,
      profession: prospectData.profession!,
      specialty: prospectData.specialty || '',
      company: prospectData.company || '',
      phone: prospectData.phone,
      linkedin_url: prospectData.linkedin_url,
      years_experience: prospectData.years_experience!,
      current_tools: prospectData.current_tools || [],
      pain_points: prospectData.pain_points || [],
      invitation_sent: false,
      response_status: 'pending',
      demo_scheduled: false,
      notes: prospectData.notes || '',
      priority_score: prospectData.priority_score!,
      referral_source: 'manual_entry',
      created_at: prospectData.created_at!
    };

    setProspects(prev => [...prev, newProspect]);
  };

  // Send individual invite
  const handleSendInvite = async (prospect: BetaInvite) => {
    try {
      // Get appropriate email template
      const template = prospect.profession === 'legal' 
        ? EMAIL_TEMPLATES.legal_initial 
        : EMAIL_TEMPLATES.medical_initial;

      // Replace template variables
      let emailContent = template.template;
      const replacements = {
        '{{first_name}}': prospect.first_name,
        '{{last_name}}': prospect.last_name,
        '{{specialty}}': prospect.specialty || prospect.profession,
        '{{years_experience}}': prospect.years_experience.toString(),
        '{{company}}': prospect.company || 'your practice'
      };

      Object.entries(replacements).forEach(([key, value]) => {
        emailContent = emailContent.replace(new RegExp(key, 'g'), value);
      });

      // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
      console.log('Sending email to:', prospect.email);
      console.log('Subject:', template.subject);
      console.log('Content:', emailContent);

      // Update prospect status
      setProspects(prev => prev.map(p => 
        p.id === prospect.id 
          ? { ...p, invitation_sent: true, invited_at: new Date().toISOString() }
          : p
      ));

      alert(`Beta invitation sent to ${prospect.first_name} ${prospect.last_name}!`);

    } catch (error) {
      console.error('Failed to send invite:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  // Send bulk invites
  const handleBulkInvite = async (selectedProspects: BetaInvite[]) => {
    for (const prospect of selectedProspects) {
      if (!prospect.invitation_sent) {
        await handleSendInvite(prospect);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Calculate stats
  const stats = {
    total_prospects: prospects.length,
    legal_prospects: prospects.filter(p => p.profession === 'legal').length,
    medical_prospects: prospects.filter(p => p.profession === 'medical').length,
    invites_sent: prospects.filter(p => p.invitation_sent).length,
    responses: prospects.filter(p => p.response_status !== 'pending').length,
    accepted: prospects.filter(p => p.response_status === 'accepted').length,
    conversion_rate: prospects.filter(p => p.invitation_sent).length > 0 
      ? Math.round((prospects.filter(p => p.response_status === 'accepted').length / prospects.filter(p => p.invitation_sent).length) * 100)
      : 0
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Beta User Outreach System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Target 100 legal and medical professionals for exclusive GenieFlow AI beta access
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setCurrentView('overview')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentView('prospects')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'prospects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Prospects ({prospects.length})
          </button>
          <button
            onClick={() => setCurrentView('campaigns')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'campaigns' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Campaigns
          </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'overview' && (
        <div className="space-y-8">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_prospects}</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invites Sent</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.invites_sent}</p>
                </div>
                <Send className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.accepted}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.conversion_rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Target Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROFESSION_TARGETS.map((target) => {
              const count = target.id === 'attorneys' ? stats.legal_prospects : stats.medical_prospects;
              const progress = Math.min(100, (count / target.target_count) * 100);

              return (
                <div key={target.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {target.icon} {target.name}
                    </h3>
                    <span className="text-2xl font-bold text-gray-900">
                      {count} / {target.target_count}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Key Value Props:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {target.value_props.slice(0, 3).map((prop, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span>{prop}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Form */}
          <BetaInviteForm onSubmit={handleAddProspect} />
        </div>
      )}

      {currentView === 'prospects' && (
        <div className="space-y-6">
          <BetaInviteForm onSubmit={handleAddProspect} />
          <BetaProspectList 
            prospects={prospects}
            onSendInvite={handleSendInvite}
            onBulkInvite={handleBulkInvite}
          />
        </div>
      )}

      {currentView === 'campaigns' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h3>
          
          <div className="space-y-6">
            {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{template.subject}</h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded overflow-x-auto">
                  {template.template}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BetaUserOutreach;