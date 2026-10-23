/**
 * 📱 Mobile Bridge Service
 * 
 * Real-time synchronization service for mobile AI agent access
 * Enables seamless cross-device workflow continuation
 */

import { supabase } from '../lib/supabase';
import { EventEmitter } from 'events';

interface MobileSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  lastActive: Date;
  context: any;
  status: 'active' | 'idle' | 'offline';
}

interface SyncableData {
  conversations: any[];
  canvases: any[];
  tasks: any[];
  agents: any[];
  preferences: any;
  lastSync: Date;
}

interface CrossDeviceEvent {
  type: 'conversation_update' | 'canvas_change' | 'task_progress' | 'agent_response';
  deviceId: string;
  data: any;
  timestamp: Date;
}

export class MobileBridgeService extends EventEmitter {
  private sessions: Map<string, MobileSession> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private realtimeChannel: any = null;
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the mobile bridge service
   */
  private async initialize() {
    console.log('📱 Mobile Bridge: Initializing...');
    
    try {
      // Setup realtime channel for cross-device sync
      this.realtimeChannel = supabase
        .channel('mobile-sync')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'conversations' }, 
          (payload) => this.handleConversationSync(payload)
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'canvases' }, 
          (payload) => this.handleCanvasSync(payload)
        )
        .on('broadcast', 
          { event: 'device-event' }, 
          (payload) => this.handleCrossDeviceEvent(payload)
        )
        .subscribe();

      // Start sync interval
      this.syncInterval = setInterval(() => {
        this.syncActiveSessions();
      }, 30000); // Sync every 30 seconds

      this.isInitialized = true;
      console.log('📱 Mobile Bridge: Initialized successfully');
      
    } catch (error) {
      console.error('📱 Mobile Bridge: Initialization failed:', error);
    }
  }

  /**
   * Register a new mobile session
   */
  async registerMobileSession(deviceId: string, deviceType: 'mobile' | 'tablet' | 'desktop', context: any = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const session: MobileSession = {
      id: `${user.id}-${deviceId}`,
      userId: user.id,
      deviceId,
      deviceType,
      lastActive: new Date(),
      context,
      status: 'active'
    };

    this.sessions.set(session.id, session);
    
    // Store in database for persistence
    await supabase
      .from('mobile_sessions')
      .upsert({
        id: session.id,
        user_id: session.userId,
        device_id: deviceId,
        device_type: deviceType,
        last_active: session.lastActive.toISOString(),
        context: context,
        status: session.status
      });

    console.log('📱 Mobile session registered:', deviceId);
    this.emit('session_registered', session);
    
    return session;
  }

  /**
   * Sync data for mobile app
   */
  async syncMobileData(deviceId: string): Promise<SyncableData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Get conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      // Get canvases
      const { data: canvases } = await supabase
        .from('canvases')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      // Get tasks  
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // Get user agents
      const { data: agents } = await supabase
        .from('ai_assistants')
        .select('*')
        .eq('user_id', user.id);

      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const syncData: SyncableData = {
        conversations: conversations || [],
        canvases: canvases || [],
        tasks: tasks || [],
        agents: agents || [],
        preferences: preferences || {},
        lastSync: new Date()
      };

      // Update session last sync
      this.updateSessionActivity(deviceId);

      console.log('📱 Mobile data synced for device:', deviceId);
      return syncData;

    } catch (error) {
      console.error('📱 Mobile sync error:', error);
      throw error;
    }
  }

  /**
   * Push mobile updates to other devices
   */
  async pushCrossDeviceUpdate(fromDeviceId: string, event: Omit<CrossDeviceEvent, 'deviceId' | 'timestamp'>) {
    if (!this.realtimeChannel) return;

    const crossDeviceEvent: CrossDeviceEvent = {
      ...event,
      deviceId: fromDeviceId,
      timestamp: new Date()
    };

    // Broadcast to all connected devices
    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'device-event',
      payload: crossDeviceEvent
    });

    console.log('📱 Cross-device update pushed:', event.type);
  }

  /**
   * Handle conversation sync from database changes
   */
  private handleConversationSync(payload: any) {
    console.log('📱 Conversation sync event:', payload.eventType);
    
    this.emit('conversation_sync', {
      type: payload.eventType,
      conversation: payload.new || payload.old,
      timestamp: new Date()
    });
  }

  /**
   * Handle canvas sync from database changes
   */
  private handleCanvasSync(payload: any) {
    console.log('📱 Canvas sync event:', payload.eventType);
    
    this.emit('canvas_sync', {
      type: payload.eventType,
      canvas: payload.new || payload.old,
      timestamp: new Date()
    });
  }

  /**
   * Handle cross-device events
   */
  private handleCrossDeviceEvent(payload: any) {
    const event = payload.payload as CrossDeviceEvent;
    console.log('📱 Cross-device event received:', event.type);
    
    this.emit('cross_device_event', event);
  }

  /**
   * Update session activity
   */
  private updateSessionActivity(deviceId: string) {
    const sessionId = Array.from(this.sessions.keys()).find(id => id.includes(deviceId));
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActive = new Date();
        session.status = 'active';
        this.sessions.set(sessionId, session);
      }
    }
  }

  /**
   * Sync active sessions periodically
   */
  private async syncActiveSessions() {
    console.log('📱 Syncing active sessions...');
    
    for (const [sessionId, session] of this.sessions) {
      const timeSinceLastActive = Date.now() - session.lastActive.getTime();
      
      // Mark as idle after 5 minutes
      if (timeSinceLastActive > 300000 && session.status === 'active') {
        session.status = 'idle';
        this.sessions.set(sessionId, session);
        
        // Update in database
        await supabase
          .from('mobile_sessions')
          .update({ status: 'idle' })
          .eq('id', sessionId);
      }
      
      // Mark as offline after 15 minutes
      if (timeSinceLastActive > 900000 && session.status !== 'offline') {
        session.status = 'offline';
        this.sessions.set(sessionId, session);
        
        // Update in database
        await supabase
          .from('mobile_sessions')
          .update({ status: 'offline' })
          .eq('id', sessionId);
      }
    }
  }

  /**
   * Get mobile-optimized conversation history
   */
  async getMobileConversationHistory(conversationId: string, limit: number = 20) {
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        role,
        created_at,
        metadata
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Optimize for mobile (reduce data size)
    return messages?.map(msg => ({
      id: msg.id,
      content: msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content,
      role: msg.role,
      timestamp: msg.created_at,
      hasMore: msg.content.length > 500
    })) || [];
  }

  /**
   * Create mobile-optimized canvas
   */
  async createMobileCanvas(title: string, contentType: string = 'document') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const canvas = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title,
      content_type: contentType,
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mobile_optimized: true
    };

    const { data, error } = await supabase
      .from('canvases')
      .insert(canvas)
      .select()
      .single();

    if (error) throw error;

    // Notify other devices
    await this.pushCrossDeviceUpdate('mobile', {
      type: 'canvas_change',
      data: { canvas: data, action: 'created' }
    });

    return data;
  }

  /**
   * Get device status summary
   */
  getDeviceStatus() {
    const activeDevices = Array.from(this.sessions.values()).filter(s => s.status === 'active');
    const idleDevices = Array.from(this.sessions.values()).filter(s => s.status === 'idle');
    
    return {
      total: this.sessions.size,
      active: activeDevices.length,
      idle: idleDevices.length,
      devices: Array.from(this.sessions.values()).map(s => ({
        deviceId: s.deviceId,
        deviceType: s.deviceType,
        status: s.status,
        lastActive: s.lastActive
      }))
    };
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    
    this.sessions.clear();
    this.removeAllListeners();
    
    console.log('📱 Mobile Bridge: Service destroyed');
  }
}

// Global instance
export const mobileBridgeService = new MobileBridgeService();

// React hook for mobile bridge
export const useMobileBridge = () => {
  const [deviceStatus, setDeviceStatus] = React.useState(mobileBridgeService.getDeviceStatus());
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const handleStatusUpdate = () => {
      setDeviceStatus(mobileBridgeService.getDeviceStatus());
    };

    mobileBridgeService.on('session_registered', handleStatusUpdate);
    mobileBridgeService.on('conversation_sync', handleStatusUpdate);
    mobileBridgeService.on('canvas_sync', handleStatusUpdate);

    // Check connection status
    const checkConnection = () => {
      setIsConnected(mobileBridgeService.isInitialized);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => {
      mobileBridgeService.off('session_registered', handleStatusUpdate);
      mobileBridgeService.off('conversation_sync', handleStatusUpdate);
      mobileBridgeService.off('canvas_sync', handleStatusUpdate);
      clearInterval(interval);
    };
  }, []);

  return {
    deviceStatus,
    isConnected,
    registerDevice: mobileBridgeService.registerMobileSession.bind(mobileBridgeService),
    syncData: mobileBridgeService.syncMobileData.bind(mobileBridgeService),
    pushUpdate: mobileBridgeService.pushCrossDeviceUpdate.bind(mobileBridgeService),
    getMobileHistory: mobileBridgeService.getMobileConversationHistory.bind(mobileBridgeService),
    createMobileCanvas: mobileBridgeService.createMobileCanvas.bind(mobileBridgeService)
  };
};

export default MobileBridgeService;