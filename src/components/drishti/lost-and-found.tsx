
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { findPerson } from '@/ai/flows/lost-and-found-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserSearch, Upload, Clock, MapPin, Video, AlertCircle } from 'lucide-react';
import type { FindPersonOutput } from '@/ai/flows/lost-and-found-flow';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function LostAndFound() {
  const [personName, setPersonName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FindPersonOutput | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageFile(null);
        setImagePreviewUrl(null);
        setValidationError('Invalid file type. Please select a JPEG, PNG, or WEBP image.');
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setImageFile(null);
        setImagePreviewUrl(null);
        setValidationError('File too large. Please select an image smaller than 4MB.');
        return;
      }
      
      // On Success
      setImageFile(file);
      if (imagePreviewUrl) {
          URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(URL.createObjectURL(file));
      setValidationError(null);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
        setValidationError("Please upload a photo to start the search.");
        return;
    }
    
    setIsSearching(true);
    setValidationError(null);
    setSearchResult(null);

    try {
      const photoDataUri = await toBase64(imageFile);
      const result = await findPerson({
        name: personName,
        photoDataUri,
      });
      setSearchResult(result);
      toast({
        title: result.found ? 'Match Found' : 'Search Initiated',
        description: result.message,
        variant: result.found ? 'default' : (result.message.startsWith("Failed to connect") ? 'destructive' : 'default'),
      });
    } catch (error) {
      console.error('Face search failed:', error);
      setValidationError('Search failed. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'There was an error while trying to find the person.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><UserSearch className="mr-2" /> Lost & Found Person Search</CardTitle>
          <CardDescription>Upload a photo of the person you are looking for. Our AI will scan camera feeds for a match.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Person&apos;s Name (Optional)</Label>
              <Input 
                id="name" 
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g., Jane Doe" 
                disabled={isSearching} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-upload">Photo</Label>
              <Input
                id="photo-upload"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
                disabled={isSearching}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSearching}>
                <Upload className="mr-2 h-4 w-4" />
                {imagePreviewUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </div>
             {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
            
            {imagePreviewUrl ? (
              <div className="flex justify-center">
                <Image src={imagePreviewUrl} alt="Preview" width={200} height={200} className="rounded-md object-cover aspect-square" />
              </div>
            ) : (
                <div className="flex justify-center items-center w-full h-48 border-2 border-dashed rounded-md bg-muted/50">
                    <p className="text-muted-foreground">Image preview will appear here</p>
                </div>
            )}

            <Button type="submit" disabled={!imageFile || isSearching} className="w-full">
              {isSearching ? (
                <>
                  <Loader className="animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <UserSearch className="mr-2" />
                  Start Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSearching && !searchResult && (
         <div className="flex items-center justify-center p-8">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="ml-4 text-lg">Searching camera feeds...</p>
         </div>
      )}

      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Search Result</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResult.found ? (
              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-300">
                    <UserSearch className="h-5 w-5 mr-3" />
                    <p>{searchResult.message}</p>
                </div>
                {searchResult.lastSeen && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold">Last Known Location:</h4>
                     <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-3 text-muted-foreground" />
                        <span>{searchResult.lastSeen.location}</span>
                    </div>
                     <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-muted-foreground" />
                        <span>{new Date(searchResult.lastSeen.timestamp).toLocaleString()}</span>
                    </div>
                     <div className="flex items-center">
                        <Video className="w-5 h-5 mr-3 text-muted-foreground" />
                        <span>{searchResult.lastSeen.cameraId}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex items-center p-3 rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <p>{searchResult.message}</p>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
