'use client';

import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { api } from '../../../convex/_generated/api';

export function OnboardingForm() {
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');

  const handleSubmit = async (skip = false) => {
    setIsLoading(true);

    try {
      await updateProfile({
        institution: skip ? undefined : (institution || undefined),
        course: skip ? undefined : (course || undefined),
      });

      router.push('/dashboard');
    } catch {
      // Ignore errors and redirect anyway
      router.push('/dashboard');
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to MarkM8</CardTitle>
        <CardDescription>
          Set up your preferences to personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Institution */}
        <div className="space-y-2">
          <Label htmlFor="institution">Institution (Optional)</Label>
          <Input
            id="institution"
            placeholder="e.g., University of Oxford"
            maxLength={200}
            value={institution}
            onChange={e => setInstitution(e.target.value)}
          />
        </div>

        {/* Course */}
        <div className="space-y-2">
          <Label htmlFor="course">Course (Optional)</Label>
          <Input
            id="course"
            placeholder="e.g., English Literature"
            maxLength={200}
            value={course}
            onChange={e => setCourse(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
