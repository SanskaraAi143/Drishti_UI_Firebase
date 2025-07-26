
'use client';

import { useState, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { findPerson } from '@/ai/flows/lost-and-found-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserSearch, Upload, Clock, MapPin, Video, AlertCircle } from 'lucide-react';
import type { FindPersonOutput } from '@/ai/flows/lost-and-found-flow';

const LostAndFoundSchema = z.object({
  name: z.string().optional(),
  photo: z.any().refine((file) => file instanceof FileList && file.length > 0, 'An image is required.'),
});
type LostAndFoundForm = z.infer<typeof LostAndFoundSchema>;

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function LostAndFound() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<FindPersonOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<LostAndFoundForm>({
    resolver: zodResolver(LostAndFoundSchema),
    mode: 'onChange'
  });

  const { register, handleSubmit, formState: { errors }, setValue } = form;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 4MB.',
        });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please select a JPEG, PNG, or WEBP image.',
        });
        return;
      }
      
      setValue('photo', files, { shouldValidate: true });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onSubmit: SubmitHandler<LostAndFoundForm> = async (data) => {
    const file = data.photo?.[0];

    if (!file) {
        toast({
            variant: "destructive",
            title: "Image Required",
            description: "Please upload a photo to start the search.",
        });
        return;
    }
    
    setIsSubmitting(true);
    setSearchResult(null);

    try {
      const photoDataUri = await toBase64(file);
      const result = await findPerson({
        name: data.name,
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
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'There was an error while trying to find the person.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { ref: photoRef, ...photoRest } = register('photo');

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><UserSearch className="mr-2" /> Lost & Found Person Search</CardTitle>
          <CardDescription>Upload a photo of the person you are looking for. Our AI will scan camera feeds for a match.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Person&apos;s Name (Optional)</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Jane Doe" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-upload">Photo</Label>
              <Input
                id="photo-upload"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                {...photoRest}
                onChange={handlePhotoChange}
                ref={(e) => {
                  photoRef(e);
                  fileInputRef.current = e;
                }}
                className="hidden"
                disabled={isSubmitting}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                <Upload className="mr-2 h-4 w-4" />
                {preview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {errors.photo && <p className="text-sm font-medium text-destructive">{errors.photo?.message as string}</p>}
            </div>
            {preview && (
              <div className="flex justify-center">
                <Image src={preview} alt="Preview" width={200} height={200} className="rounded-md object-cover aspect-square" />
              </div>
            )}
            <Button type="submit" disabled={isSubmitting || !!errors.photo || !preview} className="w-full">
              {isSubmitting ? <Loader className="animate-spin mr-2" /> : <UserSearch className="mr-2" />}
              {isSubmitting ? 'Searching...' : 'Start Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSubmitting && (
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
                <div className="flex items-center p-3 rounded-md bg-green-500/10 text-green-700">
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
                <div className="flex items-center p-3 rounded-md bg-yellow-500/10 text-yellow-700">
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

    