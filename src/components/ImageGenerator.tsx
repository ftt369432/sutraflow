import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Loader2 } from 'lucide-react';
import { assistantConversationService } from '../services/assistantConversationService';

const imageStyles = [
  { name: 'Photorealistic', value: 'photorealistic' },
  { name: 'Digital Art', value: 'digital art' },
  { name: 'Watercolor', value: 'watercolor painting style' },
  { name: 'Oil Painting', value: 'oil painting style' },
  { name: 'Pencil Sketch', value: 'pencil sketch' },
  { name: '3D Render', value: '3d render style' },
  { name: 'Fantasy', value: 'fantasy style art' },
  { name: 'Anime', value: 'anime style' }
];

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter an image description');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setGeneratedImage(null);

      const imageUrl = await assistantConversationService.generateImage({
        prompt,
        style: style !== 'none' ? style : undefined,
        negativePrompt: negativePrompt || undefined
      });

      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Image Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Image Description</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate"
            className="w-full"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Art Style</label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No specific style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific style</SelectItem>
              {imageStyles.map((styleOption) => (
                <SelectItem key={styleOption.value} value={styleOption.value}>
                  {styleOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Negative Prompt (elements to avoid)</label>
          <Input
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Elements you don't want in the image"
            className="w-full"
          />
        </div>

        <Button 
          onClick={handleGenerateImage} 
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="mt-6 text-center">
            <div className="border rounded-lg p-2 mb-4">
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="max-w-full h-auto rounded"
              />
            </div>
            <Button 
              onClick={handleDownloadImage} 
              variant="outline"
            >
              Download Image
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};