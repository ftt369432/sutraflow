import { useState, useEffect, useCallback } from 'react';
import {
  activeContextSensor,
  ActiveContextSnapshot,
  ActiveDocumentContext,
  ActiveSelectionContext,
  ActiveCaseContext,
  LegalPersona
} from '../services/context/ActiveContextSensor';

export function useActiveContext() {
  const [context, setContext] = useState<ActiveContextSnapshot>(() => activeContextSensor.getSnapshot());

  useEffect(() => {
    const unsubscribe = activeContextSensor.subscribe((snapshot) => {
      setContext(snapshot);
    });
    return unsubscribe;
  }, []);

  const setActiveDocument = useCallback((doc: ActiveDocumentContext | null) => {
    activeContextSensor.setActiveDocument(doc);
  }, []);

  const setActiveSelection = useCallback((selection: ActiveSelectionContext | null) => {
    activeContextSensor.setActiveSelection(selection);
  }, []);

  const setActivePersona = useCallback((persona: LegalPersona) => {
    activeContextSensor.setActivePersona(persona);
  }, []);

  const setActiveModel = useCallback((modelId: string) => {
    activeContextSensor.setActiveModel(modelId);
  }, []);

  const setActiveCase = useCallback((caseMeta: ActiveCaseContext | null) => {
    activeContextSensor.setActiveCase(caseMeta);
  }, []);

  const getSystemPromptSnippet = useCallback(() => {
    return activeContextSensor.toSystemPromptSnippet();
  }, []);

  return {
    context,
    activeDocument: context.activeDocument,
    activeSelection: context.activeSelection,
    activePersona: context.activePersona,
    activeModelId: context.activeModelId,
    activeRoute: context.activeRoute,
    mountedDrives: context.mountedDrives,
    activeCase: context.activeCase,
    setActiveDocument,
    setActiveSelection,
    setActivePersona,
    setActiveModel,
    setActiveCase,
    getSystemPromptSnippet
  };
}
