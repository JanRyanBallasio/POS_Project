'use client';

import React, { useState, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon, Link } from 'lucide-react';
import Image from "next/image";
import { UserIcon, KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser } from '@/hooks/users/user';
import { setAccessToken, setUser, invalidateCache } from '@/stores/userStore';
import { useRedirectIfAuth } from '@/hooks/useAuthGuard';

export default function LoginForm() {
    useRedirectIfAuth();
    const [isVisible, setIsVisible] = useState(false)
    const id = useId()
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const togglePasswordVisibility = useCallback(() => {
        setIsVisible(prev => !prev);
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password");
            return;
        }
        
        setLoading(true);
        
        try {
            const res = await loginUser({ username: username.trim(), password });
            
            // Validate response structure
            if (!res?.accessToken || !res?.data) {
                throw new Error("Invalid server response");
            }

            // Clear cache and set new data atomically
            invalidateCache();
            setAccessToken(res.accessToken);
            setUser(res.data);

            // Single navigation attempt
            router.replace("/dashboard/main");
            
        } catch (err: any) {
            console.error('[login] Error:', err);
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-full max-w-sm flex flex-col items-center gap-6 pb-[60px] px-2">
                <div className="flex flex-col items-center gap-2">
                    <Image src="/img/logo1.png" alt="App logo" width={150} height={150} priority />
                    <p className="font-bold text-2xl">Login</p>
                </div>

                <form className='w-full space-y-4' onSubmit={onSubmit} noValidate>
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className='w-full'>
                        <Label htmlFor={`${id}-username`} className='text-sm'>Username</Label>
                        <div className='relative mt-1'>
                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center ps-3'>
                                <UserIcon className='w-4 h-4' />
                                <span className='sr-only'>User</span>
                            </div>
                            <Input 
                                id={`${id}-username`} 
                                type='text' 
                                placeholder='Username' 
                                className='peer ps-9' 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>

                    <div className='w-full'>
                        <Label htmlFor={`${id}-password`} className='text-sm'>Password</Label>
                        <div className='relative mt-1'>
                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center ps-3'>
                                <KeyRound className='w-4 h-4' />
                                <span className='sr-only'>Password</span>
                            </div>
                            <Input 
                                id={`${id}-password`} 
                                type={isVisible ? 'text' : 'password'} 
                                placeholder='Password' 
                                className='peer ps-9' 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoComplete="current-password"
                                required
                            />
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={togglePasswordVisibility}
                                className='text-muted-foreground absolute inset-y-0 right-0 rounded-s-none hover:bg-transparent'
                                type='button'
                                disabled={loading}
                            >
                                {isVisible ? <EyeIcon className='w-4 h-4' /> : <EyeOffIcon className='w-4 h-4' />}
                                <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                    </div>

                    <Button 
                        className='w-full bg-black text-white rounded-md' 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Login"}
                    </Button>
                </form>

                <div className="text-center text-sm mt-2">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="underline underline-offset-4">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}