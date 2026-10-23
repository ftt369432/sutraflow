import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AddonState {
  // Existing Addons
  geniebioEnabled: boolean;
  nexusEnabled: boolean;
  developerEnabled: boolean;
  networkSyncEnabled: boolean;
  creatorEnabled: boolean;
  hqEnabled: boolean;

  // Core & AI Sidebar Items
  dashboardEnabled: boolean;
  emailEnabled: boolean;
  tasksEnabled: boolean;
  calendarEnabled: boolean;
  studiosEnabled: boolean;
  driveEnabled: boolean;
  knowledgeEnabled: boolean;
  aiAssistantEnabled: boolean;
  storeEnabled: boolean;
  academyEnabled: boolean;
  teamsEnabled: boolean;

  // Toggle Actions
  toggleDashboard: () => void;
  toggleGeniebio: () => void;
  toggleNexus: () => void;
  toggleDeveloper: () => void;
  toggleNetworkSync: () => void;
  toggleCreator: () => void;
  toggleHq: () => void;
  toggleEmail: () => void;
  toggleTasks: () => void;
  toggleCalendar: () => void;
  toggleStudios: () => void;
  toggleDrive: () => void;
  toggleKnowledge: () => void;
  toggleAiAssistant: () => void;
  toggleStore: () => void;
  toggleAcademy: () => void;
  toggleTeams: () => void;
}

export const useAddonStore = create<AddonState>()(
  persist(
    (set) => ({
      geniebioEnabled: false,
      nexusEnabled: false,
      developerEnabled: true,
      networkSyncEnabled: false,
      creatorEnabled: true,
      hqEnabled: true,

      dashboardEnabled: true,
      emailEnabled: true,
      tasksEnabled: true,
      calendarEnabled: true,
      studiosEnabled: true,
      driveEnabled: true,
      knowledgeEnabled: true,
      aiAssistantEnabled: true,
      storeEnabled: true,
      academyEnabled: true,
      teamsEnabled: true,

      toggleDashboard: () => set((state) => ({ dashboardEnabled: !state.dashboardEnabled })),
      toggleGeniebio: () => set((state) => ({ geniebioEnabled: !state.geniebioEnabled })),
      toggleNexus: () => set((state) => ({ nexusEnabled: !state.nexusEnabled })),
      toggleDeveloper: () => set((state) => ({ developerEnabled: !state.developerEnabled })),
      toggleNetworkSync: () => set((state) => ({ networkSyncEnabled: !state.networkSyncEnabled })),
      toggleCreator: () => set((state) => ({ creatorEnabled: !state.creatorEnabled })),
      toggleHq: () => set((state) => ({ hqEnabled: !state.hqEnabled })),

      toggleEmail: () => set((state) => ({ emailEnabled: !state.emailEnabled })),
      toggleTasks: () => set((state) => ({ tasksEnabled: !state.tasksEnabled })),
      toggleCalendar: () => set((state) => ({ calendarEnabled: !state.calendarEnabled })),
      toggleStudios: () => set((state) => ({ studiosEnabled: !state.studiosEnabled })),
      toggleDrive: () => set((state) => ({ driveEnabled: !state.driveEnabled })),
      toggleKnowledge: () => set((state) => ({ knowledgeEnabled: !state.knowledgeEnabled })),
      toggleAiAssistant: () => set((state) => ({ aiAssistantEnabled: !state.aiAssistantEnabled })),
      toggleStore: () => set((state) => ({ storeEnabled: !state.storeEnabled })),
      toggleAcademy: () => set((state) => ({ academyEnabled: !state.academyEnabled })),
      toggleTeams: () => set((state) => ({ teamsEnabled: !state.teamsEnabled })),
    }),
    {
      name: 'genieflow-addons-storage',
    }
  )
);
