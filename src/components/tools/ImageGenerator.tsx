import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { useAIServices } from '../../hooks/useAIServices';
import { Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/Alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { imageGenerationService } = useAIServices();

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const images = await imageGenerationService.generateImage(prompt, size);
      setGeneratedImages(images);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Image Generator</CardTitle>
          <CardDescription>
            Generate images using DALL-E. Enter a detailed prompt for best results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 font-medium">Image Size</label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="256x256">Small (256x256)</SelectItem>
                <SelectItem value="512x512">Medium (512x512)</SelectItem>
                <SelectItem value="1024x1024">Large (1024x1024)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !prompt} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        </CardContent>
        
        {generatedImages.length > 0 && (
          <CardFooter className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {generatedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={img} 
                    alt={`Generated from: ${prompt}`}
                    className="w-full h-auto rounded-md"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDownload(img)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}