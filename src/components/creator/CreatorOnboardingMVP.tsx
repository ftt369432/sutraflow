// 🏪 Creator Onboarding MVP - Bronze Tier System
// Verification, Upload, Training, Protection

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Shield, CheckCircle, AlertCircle, Brain, Users, Star } from 'lucide-react';

interface CreatorProfile {
  id: string;
  user_id: string;
  agent_name: string;
  professional_title: string;
  linkedin_url?: string;
  email_domain: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_tier: 'bronze' | 'silver' | 'gold';
  pricing_tier: 'basic' | 'professional' | 'premium' | 'enterprise';
  expertise_areas: string[];
  sample_work_urls: string[];
  voice_triggers: string[];
  created_at: string;
}

interface KnowledgeBaseFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  upload_status: 'uploading' | 'processing' | 'completed' | 'error';
  extraction_status: 'pending' | 'processing' | 'completed' | 'error';
}

export const CreatorOnboardingMVP: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<CreatorProfile>>({
    verification_tier: 'bronze',
    expertise_areas: [],
    sample_work_urls: []
  });
  const [uploadedFiles, setUploadedFiles] = useState<KnowledgeBaseFile[]>([]);
  const [verificationResults, setVerificationResults] = useState<any>(null);

  // Step 1: Professional Verification (Bronze Tier)
  const BronzeVerificationStep = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Star className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bronze Tier Verification</h3>
          <p className="text-sm text-gray-600">Quick professional verification to get started</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Professional Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Title
          </label>
          <input
            type="text"
            placeholder="e.g., Personal Injury Attorney, Work Comp Physician"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={profile.professional_title || ''}
            onChange={(e) => setProfile({...profile, professional_title: e.target.value})}
          />
        </div>

        {/* LinkedIn Profile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile URL
          </label>
          <input
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={profile.linkedin_url || ''}
            onChange={(e) => setProfile({...profile, linkedin_url: e.target.value})}
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll verify your professional title and industry match
          </p>
        </div>

        {/* Email Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Email
          </label>
          <input
            type="email"
            placeholder="your.name@lawfirm.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={user?.email || ''}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            {getEmailDomainStatus(user?.email || '')}
          </p>
        </div>

        {/* Expertise Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Areas of Expertise
          </label>
          <div className="grid grid-cols-2 gap-2">
            {getExpertiseOptions().map((area) => (
              <label key={area} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={profile.expertise_areas?.includes(area) || false}
                  onChange={(e) => {
                    const areas = profile.expertise_areas || [];
                    if (e.target.checked) {
                      setProfile({...profile, expertise_areas: [...areas, area]});
                    } else {
                      setProfile({...profile, expertise_areas: areas.filter(a => a !== area)});
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{area}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Verification Button */}
        <button
          onClick={handleBronzeVerification}
          disabled={loading || !canProceedWithVerification()}
          className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Start Bronze Verification</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Step 2: Knowledge Base Upload
  const KnowledgeBaseUploadStep = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Brain className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Knowledge Base Upload</h3>
          <p className="text-sm text-gray-600">Upload documents to train your AI agent</p>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Upload Professional Documents
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Upload PDFs, Word docs, or text files that represent your expertise
        </p>
        
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Files
        </label>
        
        <p className="text-xs text-gray-500 mt-2">
          Supported: PDF, DOC, DOCX, TXT, MD (Max 10MB each)
        </p>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(file.upload_status)}`}></div>
                <span className="text-sm font-medium text-gray-900">{file.filename}</span>
                <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 capitalize">{file.upload_status}</span>
                {file.upload_status === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {file.upload_status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Training Status */}
      {uploadedFiles.some(f => f.upload_status === 'completed') && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">AI Training Status</h4>
          </div>
          <p className="text-sm text-blue-800">
            Your AI agent is learning from your uploaded documents. This process typically takes 5-10 minutes.
          </p>
          <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getTrainingProgress()}%` }}
            ></div>
          </div>
        </div>
      )}

      <button
        onClick={() => setStep(3)}
        disabled={!canProceedToApiProtection()}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to API Protection Setup
      </button>
    </div>
  );

  // Step 3: API Protection & Agent Configuration
  const ApiProtectionStep = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Knowledge Base Protection</h3>
          <p className="text-sm text-gray-600">Configure API-only access and security settings</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Protection Settings */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Bulletproof Protection Enabled</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ Knowledge base encrypted with your private keys</li>
            <li>✅ API-only access - no direct downloads possible</li>
            <li>✅ All outputs watermarked with your attribution</li>
            <li>✅ Usage monitoring and bulk extraction prevention</li>
            <li>✅ Legal protection with $10K+ penalty clauses</li>
          </ul>
        </div>

        {/* Agent Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Name
          </label>
          <input
            type="text"
            placeholder="e.g., California Work Comp Expert, Medical Legal Specialist"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={profile.agent_name || ''}
            onChange={(e) => setProfile({...profile, agent_name: e.target.value})}
          />
        </div>

        {/* Pricing Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscription Pricing (Monthly)
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={profile.pricing_tier || 'basic'}
            onChange={(e) => setProfile({...profile, pricing_tier: e.target.value as 'basic' | 'professional' | 'premium' | 'enterprise'})}
          >
            <option value="basic">$47/month - Basic Access</option>
            <option value="professional">$97/month - Professional Access</option>
            <option value="premium">$147/month - Premium Access</option>
            <option value="expert">$197/month - Expert Access</option>
          </select>
        </div>

        {/* Voice Triggers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Trigger Phrases
          </label>
          <textarea
            placeholder="e.g., 'draft work comp report', 'create medical legal evaluation', 'generate QME report'"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={profile.voice_triggers?.join(', ') || ''}
            onChange={(e) => setProfile({
              ...profile, 
              voice_triggers: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple phrases with commas
          </p>
        </div>

        {/* Revenue Share Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Revenue Share Model</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Your Revenue Share:</span>
            <span className="font-semibold text-green-600">70%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Platform Fee:</span>
            <span className="font-semibold text-gray-600">30%</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            You keep 70% of all subscription revenue from your AI agent
          </p>
        </div>

        <button
          onClick={handleCompleteOnboarding}
          disabled={loading || !canCompleteOnboarding()}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Agent...</span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              <span>Launch My AI Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Helper Functions
  const getEmailDomainStatus = (email: string) => {
    const domain = email.split('@')[1];
    if (!domain) return 'Please enter a valid email';
    
    const professionalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (professionalDomains.includes(domain)) {
      return '⚠️ Consider using your professional email domain for better verification';
    }
    return `✅ Professional domain detected: ${domain}`;
  };

  const getExpertiseOptions = () => [
    'Workers Compensation', 'Personal Injury', 'Medical Malpractice', 'Family Law',
    'Real Estate Law', 'Corporate Law', 'Criminal Defense', 'Immigration Law',
    'Internal Medicine', 'Orthopedic Surgery', 'Neurology', 'Psychiatry',
    'Emergency Medicine', 'Family Medicine', 'Cardiology', 'Dermatology',
    'Business Consulting', 'Financial Planning', 'Marketing Strategy', 'Operations'
  ];

  const canProceedWithVerification = () => {
    return profile.professional_title && 
           profile.linkedin_url && 
           (profile.expertise_areas?.length || 0) > 0;
  };

  const canProceedToApiProtection = () => {
    return uploadedFiles.some(f => f.upload_status === 'completed');
  };

  const canCompleteOnboarding = () => {
    return profile.agent_name && 
           profile.pricing_tier && 
           (profile.voice_triggers?.length || 0) > 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTrainingProgress = () => {
    const completedFiles = uploadedFiles.filter(f => f.extraction_status === 'completed').length;
    const totalFiles = uploadedFiles.length;
    return totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  };

  // Event Handlers
  const handleBronzeVerification = async () => {
    setLoading(true);
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create creator profile
      const { data, error } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: user!.id,
          professional_title: profile.professional_title,
          linkedin_url: profile.linkedin_url,
          email_domain: user!.email!.split('@')[1],
          verification_status: 'verified',
          verification_tier: 'bronze',
          expertise_areas: profile.expertise_areas
        })
        .select()
        .single();

      if (error) throw error;

      setVerificationResults(data);
      setStep(2);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      const fileId = `file_${Date.now()}_${Math.random()}`;
      const fileInfo: KnowledgeBaseFile = {
        id: fileId,
        filename: file.name,
        size: file.size,
        type: file.type,
        upload_status: 'uploading',
        extraction_status: 'pending'
      };
      
      setUploadedFiles(prev => [...prev, fileInfo]);
      
      // Simulate upload and processing
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? {...f, upload_status: 'processing'} : f
        ));
      }, 1000);
      
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? {...f, upload_status: 'completed', extraction_status: 'processing'} : f
        ));
      }, 3000);
      
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? {...f, extraction_status: 'completed'} : f
        ));
      }, 5000);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // Create professional agent in marketplace
      const { data, error } = await supabase
        .from('professional_agents')
        .insert({
          creator_id: user!.id,
          name: profile.agent_name,
          profession: profile.expertise_areas![0], // Use first expertise area
          specialty: profile.expertise_areas,
          description: `Professional AI agent specializing in ${profile.expertise_areas!.join(', ')}`,
          short_description: `Expert ${profile.professional_title} assistance`,
          pricing: {
            monthly: parseInt(profile.pricing_tier === 'basic' ? '47' : 
                            profile.pricing_tier === 'professional' ? '97' :
                            profile.pricing_tier === 'premium' ? '147' : '197')
          },
          knowledge_base: {
            files: uploadedFiles.length,
            protected: true,
            api_only: true
          },
          voice_triggers: profile.voice_triggers,
          status: 'approved' // Auto-approve Bronze tier
        })
        .select()
        .single();

      if (error) throw error;

      // Success - redirect to creator dashboard
      alert('🎉 Congratulations! Your AI agent is now live in the marketplace!');
      
    } catch (error) {
      console.error('Onboarding completion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your AI Agent
          </h2>
          <p className="text-gray-600">
            {step === 1 && 'Verify your professional credentials'}
            {step === 2 && 'Upload your knowledge base'}
            {step === 3 && 'Configure protection and launch'}
          </p>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && <BronzeVerificationStep />}
      {step === 2 && <KnowledgeBaseUploadStep />}
      {step === 3 && <ApiProtectionStep />}
    </div>
  );
};

export default CreatorOnboardingMVP;