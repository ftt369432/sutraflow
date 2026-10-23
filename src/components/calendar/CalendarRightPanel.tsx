import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings2, User, BarChart2, Calendar as CalendarIcon, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ProductivityInsights } from './ProductivityInsights';
import { CalendarAccounts } from './CalendarAccounts';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';

interface CalendarRightPanelProps {
  className?: string;
}

export function CalendarRightPanel({ className }: CalendarRightPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className={`relative flex flex-col h-full ${className}`}>
      {/* Toggle button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute -left-10 top-2 z-10 h-8 w-8 rounded-full border shadow-sm bg-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Panel content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-l bg-background overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div className="border-b p-4">
                <h3 className="font-medium text-lg">Calendar Tools</h3>
              </div>

              <Tabs 
                defaultValue="insights" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <TabsList className="grid grid-cols-3 p-1 mx-4 mt-2">
                  <TabsTrigger value="insights">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="accounts">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only">Accounts</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings2 className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only">Settings</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="insights" className="p-4 m-0 h-full">
                    <ProductivityInsights />
                  </TabsContent>

                  <TabsContent value="accounts" className="p-4 m-0 h-full">
                    <CalendarAccounts />
                  </TabsContent>

                  <TabsContent value="settings" className="p-4 m-0 h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle>Calendar Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Auto-hide Side Panel</div>
                          <div className="flex items-center space-x-2">
                            <Switch id="auto-hide" />
                            <Label htmlFor="auto-hide">Hide panel when clicking outside</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Default View</div>
                          <select className="w-full border rounded p-2">
                            <option>Week</option>
                            <option>Month</option>
                            <option>Day</option>
                            <option>Agenda</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 