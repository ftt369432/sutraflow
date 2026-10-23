import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Label } from '../ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Loader2, Image as ImageIcon, Download, RefreshCcw } from 'lucide-react';
import { geminiSimplifiedService } from '../../services/gemini-simplified';

interface ImageGeneratorModalProps {
  assistantName: string;
  assistantDescription?: string;
  onImageGenerated: (imageUrl: string, type: 'icon' | 'avatar' | 'illustration') => void;
}

type ImageStyle = 'photorealistic' | 'digital-art' | 'minimalist' | 'cartoon' | 'abstract' | '3d-render';
type ImageType = 'icon' | 'avatar' | 'illustration';

export function ImageGeneratorModal({ 
  assistantName,
  assistantDescription,
  onImageGenerated 
}: ImageGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [imageType, setImageType] = useState<ImageType>('icon');
  const [style, setStyle] = useState<ImageStyle>('digital-art');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function to generate an image prompt based on the assistant details
  const generateImagePrompt = async () => {
    try {
      setLoading(true);
      const description = assistantDescription || 'An AI assistant';
      
      const systemPrompt = `
You are an expert AI image prompt writer. Your task is to create a detailed and effective prompt for generating an image of an AI assistant.

Type: ${imageType === 'icon' ? 'Simple icon or logo' : imageType === 'avatar' ? 'Character avatar' : 'Contextual illustration'}
Style: ${style}
Assistant name: ${assistantName}
Assistant description: ${description}

Create a prompt that would generate a ${style} ${imageType} representing this assistant. 
For icons, focus on simple, distinctive symbols.
For avatars, describe a character that embodies the assistant's purpose.
For illustrations, create a scene showing the assistant in context.

Your output should ONLY be the actual prompt text, no explanations or formatting.
`;

      const generatedPromptText = await geminiSimplifiedService.getCompletion(systemPrompt, {
        temperature: 0.7,
        maxTokens: 300,
      });

      setGeneratedPrompt(generatedPromptText);
      setPrompt(generatedPromptText);
    } catch (err) {
      console.error('Error generating image prompt:', err);
      setError('Failed to generate image prompt');
    } finally {
      setLoading(false);
    }
  };

  // Since we're operating in mock mode, this function simulates image generation
  // In a real implementation, this would call an actual image generation API
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please provide a prompt for the image');
      return;
    }

    try {
      setLoading(true);
      setImageUrl(null);
      setError(null);

      // In production, you would replace this with a call to an actual image generation API
      // For now, we'll use placeholder images

      // This is a mock implementation - in a real app, you'd call an image generation API
      const mockImageUrls: Record<ImageType, Record<ImageStyle, string>> = {
        icon: {
          'photorealistic': 'https://placehold.co/400x400/67e8f9/181818?text=Icon+Photo',
          'digital-art': 'https://placehold.co/400x400/8b5cf6/ffffff?text=Icon+Digital',
          'minimalist': 'https://placehold.co/400x400/e4e4e7/000000?text=Icon+Min',
          'cartoon': 'https://placehold.co/400x400/fde68a/000000?text=Icon+Cartoon',
          'abstract': 'https://placehold.co/400x400/f43f5e/ffffff?text=Icon+Abstract',
          '3d-render': 'https://placehold.co/400x400/a3e635/181818?text=Icon+3D'
        },
        avatar: {
          'photorealistic': 'https://placehold.co/400x400/67e8f9/181818?text=Avatar+Photo',
          'digital-art': 'https://placehold.co/400x400/8b5cf6/ffffff?text=Avatar+Digital',
          'minimalist': 'https://placehold.co/400x400/e4e4e7/000000?text=Avatar+Min',
          'cartoon': 'https://placehold.co/400x400/fde68a/000000?text=Avatar+Cartoon',
          'abstract': 'https://placehold.co/400x400/f43f5e/ffffff?text=Avatar+Abstract',
          '3d-render': 'https://placehold.co/400x400/a3e635/181818?text=Avatar+3D'
        },
        illustration: {
          'photorealistic': 'https://placehold.co/600x400/67e8f9/181818?text=Illustration+Photo',
          'digital-art': 'https://placehold.co/600x400/8b5cf6/ffffff?text=Illustration+Digital',
          'minimalist': 'https://placehold.co/600x400/e4e4e7/000000?text=Illustration+Min',
          'cartoon': 'https://placehold.co/600x400/fde68a/000000?text=Illustration+Cartoon',
          'abstract': 'https://placehold.co/600x400/f43f5e/ffffff?text=Illustration+Abstract',
          '3d-render': 'https://placehold.co/600x400/a3e635/181818?text=Illustration+3D'
        }
      };

      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setImageUrl(mockImageUrls[imageType][style]);
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleUseImage = () => {
    if (imageUrl) {
      onImageGenerated(imageUrl, imageType);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="h-4 w-4 mr-2" />
          Generate Images
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate AI Images for {assistantName}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="settings" className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image-type">Image Type</Label>
                <Select 
                  value={imageType} 
                  onValueChange={(value) => setImageType(value as ImageType)}
                >
                  <SelectTrigger id="image-type">
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icon">Icon</SelectItem>
                    <SelectItem value="avatar">Avatar</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select 
                  value={style} 
                  onValueChange={(value) => setStyle(value as ImageStyle)}
                >
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="digital-art">Digital Art</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="3d-render">3D Render</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="prompt">Image Prompt</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={generateImagePrompt}
                  disabled={loading}
                  className="h-8"
                >
                  {loading ? 
                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 
                    <RefreshCcw className="h-3 w-3 mr-1" />
                  }
                  {loading ? 'Generating...' : 'Auto-generate'}
                </Button>
              </div>
              
              <Textarea 
                id="prompt" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={4}
              />
              
              <p className="text-xs text-muted-foreground">
                Describe the image you want to generate. Be specific about style, colors, and elements.
              </p>
            </div>
            
            <Button 
              onClick={generateImage} 
              disabled={!prompt.trim() || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              {loading ? 'Generating Image...' : 'Generate Image'}
            </Button>
          </TabsContent>
          
          <TabsContent value="result" className="py-4">
            {imageUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="border rounded-md p-1 bg-background">
                    <img 
                      src={imageUrl} 
                      alt="Generated assistant image"
                      className={`rounded ${imageType === 'illustration' ? 'max-h-[300px] w-auto' : 'max-h-[250px] w-auto'}`}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Badge variant="outline">{style}</Badge>
                    <Badge variant="outline">{imageType}</Badge>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-2">{error}</p>
                <Button variant="outline" onClick={generateImage}>Try Again</Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No image generated yet</p>
                <p className="text-sm mt-1">Go to the Settings tab to generate an image</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUseImage}
            disabled={!imageUrl || loading}
          >
            Use This Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}