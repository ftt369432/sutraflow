import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, Brain, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { heartbeat } from '../../cortex/Heartbeat';

export const CortexWidget = () => {
    const [lastPulse, setLastPulse] = useState<number>(Date.now());
    const [activeSoul, setActiveSoul] = useState<string>("Initializing...");
    const [isAlive, setIsAlive] = useState(false);

    useEffect(() => {
        // Initial check
        setIsAlive(true);

        const handlePulse = (e: CustomEvent) => {
            setLastPulse(e.detail.timestamp);
            setActiveSoul(e.detail.soul || "Unknown Soul");

            // Visual flash effect could be added here
        };

        window.addEventListener('cortex-pulse' as any, handlePulse);
        return () => window.removeEventListener('cortex-pulse' as any, handlePulse);
    }, []);

    const timeSincePulse = Math.floor((Date.now() - lastPulse) / 1000);

    return (
        <Card className="col-span-1 border-purple-500/20 bg-purple-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Cortex Status
                </CardTitle>
                {timeSincePulse < 5 ? (
                    <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                ) : (
                    <Activity className="h-4 w-4 text-gray-400" />
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-green-500">ONLINE</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Soul:</span>
                        <span className="font-medium truncate max-w-[120px]" title={activeSoul}>
                            {activeSoul.replace('Identity: ', '')}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Pulse:</span>
                        <span>{timeSincePulse}s ago</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => heartbeat.forcePulse && heartbeat.forcePulse()} // Assuming we add this for testing
                    >
                        <Zap className="mr-2 h-3 w-3" />
                        Force Pulse
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
