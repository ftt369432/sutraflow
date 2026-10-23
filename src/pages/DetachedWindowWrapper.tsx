import React from 'react';
import { useParams } from 'react-router-dom';
import { DoubleScreenLayout } from '../components/layout/DoubleScreenLayout';

export const DetachedWindowWrapper = () => {
    const { panel } = useParams<{ panel: string }>();

    // Validate panel type
    const validPanels = ['chat', 'canvas', 'email', 'browser', 'ai-drive', 'orchestrator'];
    const panelType = validPanels.includes(panel || '') ? panel : 'canvas';

    return <DoubleScreenLayout panelType={panelType || 'canvas'} />;
};

export default DetachedWindowWrapper;
