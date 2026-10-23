import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Plus, Settings, Scale, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { useSwarmStore, Swarm, SwarmMember } from '../../stores/swarmStore';

export function SwarmPanel() {
  const navigate = useNavigate();
  const {
    swarms,
    fetchSwarms,
    isLoading,
    error,
  } = useSwarmStore();

  useEffect(() => {
    fetchSwarms();
  }, [fetchSwarms]);

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Swarms
          </h3>
          <Button size="sm" onClick={() => navigate('/configure-swarm')}>
            <Scale className="h-4 w-4 mr-2" />
            Create Swarm
          </Button>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground">Total Swarms</h4>
          <p className="text-3xl font-bold">{isLoading ? '-' : swarms.length}</p>
        </div>
      </div>

      <div className="p-4 flex-grow overflow-hidden">
        <h4 className="text-md font-semibold mb-3 flex items-center"><Zap className="h-5 w-5 mr-2 text-primary"/>Active AI Swarms</h4>
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading swarms...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-destructive">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>Error loading swarms: {error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchSwarms()} className="mt-4">
              Try Again
            </Button>
          </div>
        )}
        {!isLoading && !error && (
          <ScrollArea className="h-[calc(100vh-350px)] pr-2">
            {swarms.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">No Active Swarms</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a swarm to coordinate multiple AI agents for complex tasks.
                </p>
                <Button size="sm" onClick={() => navigate('/configure-swarm')}>
                  <Scale className="h-4 w-4 mr-2" />
                  Create Swarm
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {swarms.map((swarm: Swarm) => (
                  <Card key={swarm.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {swarm.name}
                          <Badge 
                            variant={swarm.status === 'active' ? 'default' : 
                                     swarm.status === 'creating' ? 'outline' : 'secondary'}
                            className={swarm.status === 'active' ? 'bg-green-500 text-white' : 
                                       swarm.status === 'error' ? 'bg-red-500 text-white' : ''}
                          >
                            {swarm.status}
                          </Badge>
                          {swarm.type === 'legal' && swarm.description.includes('compensation') && (
                             <Badge variant="outline" className="ml-2">workers-compensation</Badge>
                          )}
                           <Badge variant="outline" className="ml-2 capitalize">{swarm.type}</Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">{swarm.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/configure-swarm/${swarm.id}`)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{swarm.members.length}</div>
                          <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{swarm.efficiency || 'N/A'}%</div>
                          <div className="text-xs text-muted-foreground">Efficiency</div>
                        </div>
                      </div>
                    </div>

                    {swarm.members && swarm.members.length > 0 && (
                       <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Members:</p>
                        {swarm.members.map((member: SwarmMember) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <div className="font-medium text-sm">{member.name}</div>
                              <div className="text-xs text-muted-foreground">Role: {member.role}</div>
                              {member.capabilities && Array.isArray(member.capabilities) && member.capabilities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {member.capabilities.map((capability, i) => (
                                    <Badge key={i} variant="outline" className="text-xs px-1 py-0.5">
                                      {capability}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge 
                                variant={
                                  member.status === 'active' ? 'default' :
                                  member.status === 'pending' ? 'outline' :
                                  member.status === 'error' ? 'destructive' : 'secondary'
                                }
                                className={member.status === 'active' ? 'bg-green-500 text-white' : ''}
                              >
                                {member.status}
                              </Badge>
                              <div className="text-right">
                                <div className="text-sm font-medium">{member.performance || '-'}%</div>
                                <div className="text-xs text-muted-foreground">Perf.</div>
                                <div className="text-sm font-medium">{member.tasksCompleted || 0}</div>
                                <div className="text-xs text-muted-foreground">Tasks</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}