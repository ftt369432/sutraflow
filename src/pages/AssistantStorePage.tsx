import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Search, 
  Star, 
  Download, 
  Zap, 
  Briefcase, 
  Heart, 
  Car, 
  Home, 
  Palette, 
  Calculator, 
  Stethoscope,
  GraduationCap,
  Building,
  Code,
  Camera,
  Utensils,
  Plane,
  TrendingUp,
  Users,
  Eye,
  Filter,
  Grid,
  List,
  Plus,
  CheckCircle,
  Store,
  ShoppingCart,
  Crown,
  Sparkles,
  Bot,
  Settings,
  Activity,
  Brain,
  Command,
  Mic,
  FileText,
  Mail,
  Target,
  Play,
  BarChart3,
  ArrowRight,
  Cog,
  DollarSign
} from 'lucide-react';
import { assistantStoreService } from '../services/AssistantStoreService';
import { gpackService, skillStack } from '../services/GpackService';
import { SkillStackPanel } from '../components/skills/SkillStackPanel';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface AssistantTemplate {
  id: string;
  name: string;
  description: string;
  profession: string;
  category: string;
  capabilities: string[];
  templates: string[];
  rating: number;
  downloads: number;
  price: number; // 0 for free
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  featured: boolean;
  trending: boolean;
  tags: string[];
  preview: {
    thumbnail: string;
    screenshots: string[];
  };
  lastUpdated: string;
  version: string;
}

const AssistantStorePage: React.FC = () => {
  const [assistants, setAssistants] = useState<AssistantTemplate[]>([]);
  const [filteredAssistants, setFilteredAssistants] = useState<AssistantTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'name'>('popular');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('store');
  
  // Agent Hub System Health Data
  const [systemHealthData] = useState({
    totalSystems: 3,
    totalAgents: 22,
    systemStats: {
      canvas: { totalAgents: 10, activeAgents: 9, averageSuccessRate: 0.95 },
      workflow: { totalAgents: 4, activeAgents: 4, averageSuccessRate: 0.92 },
      email: { totalAgents: 8, activeAgents: 7, averageSuccessRate: 0.96 }
    }
  });

  const systemHealth = [
    { name: 'Canvas Agents', status: 'online', agents: 9 },
    { name: 'Workflow Agents', status: 'online', agents: 4 },
    { name: 'Email Agents', status: 'online', agents: 7 }
  ];

  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Categories', icon: Grid },
    { id: 'featured', name: 'Featured', icon: Crown },
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'new', name: 'New Releases', icon: Sparkles },
    { id: 'free', name: 'Free', icon: CheckCircle },
    { id: 'premium', name: 'Premium', icon: Star }
  ];

  const professions = [
    { id: 'all', name: 'All Professions', icon: Users },
    { id: 'legal', name: 'Legal', icon: Briefcase },
    { id: 'medical', name: 'Medical', icon: Stethoscope },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'technology', name: 'Technology', icon: Code },
    { id: 'creative', name: 'Creative', icon: Palette },
    { id: 'healthcare', name: 'Healthcare', icon: Heart },
    { id: 'finance', name: 'Finance', icon: Calculator },
    { id: 'real_estate', name: 'Real Estate', icon: Home },
    { id: 'automotive', name: 'Automotive', icon: Car },
    { id: 'hospitality', name: 'Hospitality', icon: Utensils },
    { id: 'travel', name: 'Travel', icon: Plane },
    { id: 'photography', name: 'Photography', icon: Camera }
  ];

  // System Cards for Agent Hub functionality
  const systemCards = [
    {
      id: 'automation',
      title: 'Voice Automation Hub',
      description: 'Voice orchestration, workflow automation, and agent coordination',
      route: '/automation',
      icon: Mic,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      status: 'active',
      agentCount: systemHealthData.systemStats.workflow.totalAgents,
      features: ['Voice Commands', 'Workflow Automation', 'Agent Swarms', 'Real-time Processing']
    },
    {
      id: 'workflow-demo',
      title: 'Workflow System Demo',
      description: 'Interactive demonstrations of all system capabilities',
      route: '/workflow-demo',
      icon: Play,
      color: 'bg-green-100 text-green-800 border-green-200', 
      status: 'demo',
      features: ['Live Demonstrations', 'System Testing', 'Performance Metrics', 'Industry Examples']
    },
    {
      id: 'creator-dashboard',
      title: 'Creator Marketplace',
      description: 'Professional dashboard for building and monetizing AI assistants',
      route: '/creator/dashboard',
      icon: Crown,
      color: 'bg-sky-100 text-sky-800 border-sky-200',
      status: 'active',
      features: ['Revenue Tracking', 'Agent Management', 'Professional Templates', 'Marketplace Analytics']
    },
    {
      id: 'agent-wizard',
      title: 'Agent Creation Wizard',
      description: '5-step stackable agent builder for professionals',
      route: '/creator/create-agent',
      icon: Bot,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      status: 'active',
      features: ['Stackable Modules', 'Professional Templates', 'Revenue Models', 'California Work Comp Attorney']
    }
  ];

  useEffect(() => {
    loadAssistants();
  }, []);

  useEffect(() => {
    filterAndSortAssistants();
  }, [assistants, searchQuery, selectedCategory, selectedProfession, sortBy]);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      const data = await assistantStoreService.getAssistants();
      setAssistants(data);
    } catch (error) {
      console.error('Failed to load assistants:', error);
      toast.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssistants = () => {
    let filtered = [...assistants];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(assistant =>
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        assistant.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'featured':
          filtered = filtered.filter(a => a.featured);
          break;
        case 'trending':
          filtered = filtered.filter(a => a.trending);
          break;
        case 'new':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(a => new Date(a.lastUpdated) > weekAgo);
          break;
        case 'free':
          filtered = filtered.filter(a => a.price === 0);
          break;
        case 'premium':
          filtered = filtered.filter(a => a.price > 0);
          break;
      }
    }

    // Profession filter
    if (selectedProfession !== 'all') {
      filtered = filtered.filter(a => a.profession === selectedProfession);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredAssistants(filtered);
  };

  const handleInstallAssistant = async (assistant: AssistantTemplate) => {
    try {
      // If this is a real .gpack listing with a download URL, use the gpackService
      // which downloads, extracts the tool registry, and stacks it into SkillBridge
      const storeRecord = assistants.find(a => a.id === assistant.id) as any;
      const gpackUrl = storeRecord?.gpack_url || storeRecord?.installData?.gpackUrl;

      if (gpackUrl) {
        const result = await gpackService.installFromMarketplace(
          assistant.id,
          gpackUrl,
          assistant.name
        );
        if (result.success) {
          navigate('/workspace', { state: { assistantId: assistant.id } });
        }
      } else {
        // Fallback: demo/legacy install (no .gpack yet)
        await assistantStoreService.installAssistant(assistant.id);
        toast.success(`${assistant.name} installed! Open workspace to use it.`);
        navigate('/workspace', { state: { assistantId: assistant.id } });
      }
    } catch (error) {
      console.error('Failed to install assistant:', error);
      toast.error('Failed to install assistant');
    }
  };

  const handlePreviewAssistant = (assistant: AssistantTemplate) => {
    navigate(`/assistant-preview/${assistant.id}`);
  };

  const AssistantCard: React.FC<{ assistant: AssistantTemplate }> = ({ assistant }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white/50 backdrop-blur-sm">
      <div className="relative">
        <img
          src={assistant.preview.thumbnail}
          alt={assistant.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {assistant.featured && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0">
            <Crown className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        )}
        {assistant.trending && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            onClick={() => handlePreviewAssistant(assistant)}
            className="bg-white/90 text-black hover:bg-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
              {assistant.name}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Avatar className="w-5 h-5">
                <AvatarImage src={assistant.creator.avatar} />
                <AvatarFallback className="text-xs">{assistant.creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 truncate">{assistant.creator.name}</span>
              {assistant.creator.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{assistant.rating}</span>
            </div>
            <div className="text-xs text-gray-500">
              {assistant.downloads.toLocaleString()} installs
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {assistant.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {professions.find(p => p.id === assistant.profession)?.name}
          </Badge>
          {assistant.capabilities.slice(0, 2).map((cap, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {cap}
            </Badge>
          ))}
          {assistant.capabilities.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{assistant.capabilities.length - 2} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {assistant.price === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              <span>${assistant.price}</span>
            )}
          </div>
          <Button
            onClick={() => handleInstallAssistant(assistant)}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const AssistantListItem: React.FC<{ assistant: AssistantTemplate }> = ({ assistant }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow border-0 bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <img
            src={assistant.preview.thumbnail}
            alt={assistant.name}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer truncate">
                  {assistant.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={assistant.creator.avatar} />
                    <AvatarFallback className="text-xs">{assistant.creator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600 truncate">{assistant.creator.name}</span>
                  {assistant.creator.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {assistant.description}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="flex items-center space-x-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{assistant.rating}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {assistant.downloads.toLocaleString()} installs
                </div>
                <div className="text-lg font-bold mb-2">
                  {assistant.price === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>${assistant.price}</span>
                  )}
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewAssistant(assistant)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleInstallAssistant(assistant)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Install
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              <Badge variant="outline" className="text-xs">
                {professions.find(p => p.id === assistant.profession)?.name}
              </Badge>
              {assistant.capabilities.slice(0, 3).map((cap, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))}
              {assistant.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{assistant.capabilities.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Assistant Hub & Store</h1>
                  <p className="text-gray-600 mt-1">
                    Discover assistants, manage agents, and control automation - All in one place
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/create-assistant')}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Assistant
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search assistants, professions, capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 border-gray-200"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white/80"
              title="Sort assistants by"
              aria-label="Sort assistants by"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Alphabetical</option>
            </select>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="store">Assistant Store</TabsTrigger>
            <TabsTrigger value="agents">Agent Hub</TabsTrigger>
          </TabsList>
          
          <TabsContent value="store" className="mt-6">
            <div className="flex space-x-6">
              {/* Sidebar Filters */}
              <div className="w-64 space-y-6">
                {/* Categories */}
                <Card className="border-0 bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{category.name}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Professions */}
                <Card className="border-0 bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Professions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                    {professions.map((profession) => {
                      const Icon = profession.icon;
                      return (
                        <button
                          key={profession.id}
                          onClick={() => setSelectedProfession(profession.id)}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedProfession === profession.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{profession.name}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse border-0 bg-white/50 backdrop-blur-sm">
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                        <CardHeader>
                          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {filteredAssistants.length} Assistant{filteredAssistants.length !== 1 ? 's' : ''} Found
                        </h2>
                        <p className="text-gray-600">
                          {selectedProfession !== 'all' && 
                            `in ${professions.find(p => p.id === selectedProfession)?.name}`
                          }
                          {selectedCategory !== 'all' && 
                            ` • ${categories.find(c => c.id === selectedCategory)?.name}`
                          }
                        </p>
                      </div>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssistants.map((assistant) => (
                          <AssistantCard key={assistant.id} assistant={assistant} />
                        ))}
                      </div>
                    ) : (
                      <div>
                        {filteredAssistants.map((assistant) => (
                          <AssistantListItem key={assistant.id} assistant={assistant} />
                        ))}
                      </div>
                    )}

                    {filteredAssistants.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No assistants found</h3>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your search criteria or browse different categories
                        </p>
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setSelectedProfession('all');
                          }}
                          variant="outline"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <div className="space-y-6">
              {/* System Health Dashboard */}
              <Card className="border-0 bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {systemHealth.map((system, index) => (
                      <div key={index} className="bg-white/60 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{system.name}</span>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            system.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {system.status}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{system.agents} agents active</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Navigation */}
              <Card className="border-0 bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Command className="w-5 h-5 text-blue-500" />
                    <span>Agent Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {systemCards.map((card, index) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => navigate(card.route)}
                          className="bg-white/60 p-4 rounded-lg hover:bg-white/80 transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-2 rounded-lg ${card.color}`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                              {card.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600">{card.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Registry Overview */}
              <Card className="border-0 bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <span>Active Agent Registry</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/60 p-6 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {systemHealth.reduce((total, system) => total + system.agents, 0)}
                      </div>
                      <p className="text-gray-600 mb-4">Total Active Agents</p>
                      <div className="flex justify-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{systemHealth.filter(s => s.status === 'online').length} Systems Online</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>4 Agent Types</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssistantStorePage;