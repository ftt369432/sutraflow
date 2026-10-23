import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface Annotation {
  id: string;
  page: number;
  type: 'pen' | 'highlight' | 'text' | 'rect';
  color: string;
  points?: { x: number; y: number }[]; // Normalized 0-1
  rect?: { x: number; y: number; w: number; h: number }; // Normalized 0-1
  text?: string;
  timestamp: string;
}

interface GenieDrivePDFAnnotationLayerProps {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  activeMode: 'none' | 'pen' | 'highlight' | 'text' | 'eraser';
  activeColor: string;
}

export function GenieDrivePDFAnnotationLayer({
  pageNumber,
  width,
  height,
  scale,
  annotations,
  onAddAnnotation,
  activeMode,
  activeColor
}: GenieDrivePDFAnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  // Filter annotations for this specific page
  const pageAnnotations = annotations.filter(a => a.page === pageNumber);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw existing annotations
    pageAnnotations.forEach(anno => {
      ctx.strokeStyle = anno.color;
      ctx.lineWidth = anno.type === 'highlight' ? 20 / scale : 3 / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (anno.type === 'pen' || anno.type === 'highlight') {
        if (!anno.points || anno.points.length < 2) return;
        
        ctx.beginPath();
        if (anno.type === 'highlight') ctx.globalAlpha = 0.4;
        else ctx.globalAlpha = 1.0;

        ctx.moveTo(anno.points[0].x * width, anno.points[0].y * height);
        for (let i = 1; i < anno.points.length; i++) {
          ctx.lineTo(anno.points[i].x * width, anno.points[i].y * height);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw current stroke
    if (isDrawing && currentPoints.length > 1) {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = activeMode === 'highlight' ? 20 / scale : 3 / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (activeMode === 'highlight') ctx.globalAlpha = 0.4;
      
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x * width, currentPoints[0].y * height);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x * width, currentPoints[i].y * height);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }, [pageAnnotations, isDrawing, currentPoints, width, height, activeColor, activeMode, scale]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeMode === 'none' || activeMode === 'eraser') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;
    
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;
    
    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (currentPoints.length > 1) {
      onAddAnnotation({
        id: Math.random().toString(36).substr(2, 9),
        page: pageNumber,
        type: activeMode as 'pen' | 'highlight',
        color: activeColor,
        points: currentPoints,
        timestamp: new Date().toISOString()
      });
    }
    setCurrentPoints([]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn(
        "absolute top-0 left-0 z-10 touch-none",
        activeMode !== 'none' ? "cursor-crosshair" : "pointer-events-none"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
