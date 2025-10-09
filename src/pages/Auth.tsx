import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/');
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!', description: 'Signed in successfully.' });
      navigate('/');
    }
  };

  const handleSignUp = async () => {
    console.log('🔵 [SIGNUP] Starting signup process...');
    console.log('🔵 [SIGNUP] Email:', email);
    console.log('🔵 [SIGNUP] Supabase URL:', 'https://sqdjteugxarustivcpqs.supabase.co');
    console.log('🔵 [SIGNUP] Current origin:', window.location.origin);
    
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    console.log('🔵 [SIGNUP] Redirect URL:', redirectUrl);
    
    try {
      // Step 1: Sign up the user
      console.log('🔵 [SIGNUP] Calling supabase.auth.signUp...');
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl }
      });
      
      console.log('🔵 [SIGNUP] SignUp result:', JSON.stringify(signUpResult, null, 2));
      
      if (signUpResult.error) {
        console.error('🔴 [SIGNUP ERROR]', signUpResult.error);
        console.error('🔴 [SIGNUP ERROR] Full error object:', JSON.stringify(signUpResult.error, null, 2));
        setLoading(false);
        toast({ 
          title: 'Sign up failed', 
          description: `${signUpResult.error.message} (${signUpResult.error.status || 'no status'})`,
          variant: 'destructive' 
        });
        return;
      }
      
      console.log('✅ [SIGNUP] User created:', signUpResult.data.user?.id);
      
      // Step 2: Immediately sign in the user (since email confirmation is disabled)
      console.log('🔵 [SIGNUP] Attempting immediate sign in...');
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('🔵 [SIGNUP] SignIn result:', JSON.stringify(signInResult, null, 2));
      
      setLoading(false);
      
      if (signInResult.error) {
        console.error('🔴 [SIGNIN ERROR]', signInResult.error);
        toast({ 
          title: 'Account created', 
          description: 'Please sign in to continue.', 
          variant: 'default' 
        });
      } else {
        console.log('✅ [SIGNUP] Sign in successful, session created');
        toast({ 
          title: 'Welcome!', 
          description: 'Your account has been created successfully.' 
        });
        // Navigation will be handled by onAuthStateChange in useEffect
      }
    } catch (err) {
      console.error('🔴 [SIGNUP EXCEPTION]', err);
      console.error('🔴 [SIGNUP EXCEPTION] Stack:', (err as Error).stack);
      setLoading(false);
      toast({ 
        title: 'Signup error', 
        description: `Unexpected error: ${(err as Error).message}`,
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{mode === 'signin' ? 'Sign In' : 'Create Account'}</CardTitle>
          <CardDescription>
            {mode === 'signin' ? 'Welcome back to SmartCart' : 'Join SmartCart to save time and money'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {mode === 'signin' ? (
            <Button onClick={handleSignIn} disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign In'}</Button>
          ) : (
            <Button onClick={handleSignUp} disabled={loading} className="w-full">{loading ? 'Creating account...' : 'Sign Up'}</Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <button onClick={() => setMode('signup')} className="underline">Need an account? Sign up</button>
            ) : (
              <button onClick={() => setMode('signin')} className="underline">Already have an account? Sign in</button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
