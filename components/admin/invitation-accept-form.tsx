'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

const invitationAcceptSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters zijn'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
});

type InvitationAcceptFormData = z.infer<typeof invitationAcceptSchema>;

interface InvitationAcceptFormProps {
  invitation: {
    token: string;
    email: string;
    role: 'USER' | 'ADMIN';
    sender: {
      name: string | null;
      company?: { name: string | null } | null;
    };
  };
}

export function InvitationAcceptForm({ invitation }: InvitationAcceptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<InvitationAcceptFormData>({
    resolver: zodResolver(invitationAcceptSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: InvitationAcceptFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.token,
          name: data.name,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Account aanmaken mislukt');
      }

      toast.success('Account aangemaakt! Je kunt nu inloggen.');
      router.push('/login?message=account_created');
    } catch (error) {
      console.error('Accept invitation error:', error);
      toast.error(error instanceof Error ? error.message : 'Account aanmaken mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uitnodiging accepteren</CardTitle>
        <CardDescription>
          Je bent uitgenodigd door {invitation.sender.name || invitation.sender.company?.name || 'een beheerder'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span className="font-medium">{invitation.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2">
            <User className="h-4 w-4" />
            <span className="text-muted-foreground">
              Rol: {invitation.role === 'ADMIN' ? 'Beheerder' : 'Gebruiker'}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naam</FormLabel>
                  <FormControl>
                    <Input placeholder="Je volledige naam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wachtwoord</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Minimaal 6 karakters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bevestig wachtwoord</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Herhaal wachtwoord" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Account aanmaken...
                </>
              ) : (
                'Account aanmaken'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
