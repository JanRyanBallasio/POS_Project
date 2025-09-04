// ...existing code...
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Image from "next/image";
import { UserIcon, KeyRound } from 'lucide-react';
import { useRedirectIfAuth } from '@/hooks/useAuthGuard';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/hooks/users/user';

export default function LoginForm() {
    useRedirectIfAuth();
    const [isVisible, setIsVisible] = useState(false)
    const id = useId()
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            alert("Enter username and password");
            return;
        }
        setLoading(true);
        try {
            const res = await loginUser({ username, password });
            console.debug('[login] response', res);
            // Save accessToken (key expected by axios/interceptors) and user
            if (res?.accessToken) {
                localStorage.setItem("accessToken", res.accessToken);
            }
            if (res?.data) {
                localStorage.setItem("user", JSON.stringify(res.data));
            }

            // try client navigation first, fallback to full navigation (forces request -> middleware)
            try {
                await router.push("/dashboard/main");
                console.debug('[login] router.push complete');
            } catch (navErr) {
                console.warn('[login] router.push failed, falling back to full navigation', navErr);
                window.location.href = "/dashboard/main";
            }
        } catch (err: any) {
            alert(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-full max-w-sm flex flex-col items-center gap-6 pb-[60px] px-2">
                <div className="flex flex-col items-center gap-2">
                    <Image src="/img/logo1.png" alt="App logo" width={150} height={150} />
                    <p className="font-bold text-2xl">Login</p>
                </div>

                <form className='w-full space-y-4' onSubmit={onSubmit}>
                    <div className='w-full'>
                        <Label htmlFor={`${id}-username`} className='text-sm'>Username</Label>
                        <div className='relative mt-1'>
                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center ps-3'>
                                <UserIcon className='w-4 h-4' />
                                <span className='sr-only'>User</span>
                            </div>
                            <Input id={`${id}-username`} type='text' placeholder='Username' className='peer ps-9' value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                    </div>

                    <div className='w-full'>
                        <Label htmlFor={`${id}-password`} className='text-sm'>Password</Label>
                        <div className='relative mt-1'>
                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center ps-3'>
                                <KeyRound className='w-4 h-4' />
                                <span className='sr-only'>Password</span>
                            </div>
                            <Input id={`${id}-password`} type={isVisible ? 'text' : 'password'} placeholder='Password' className='peer ps-9' value={password} onChange={(e) => setPassword(e.target.value)} />
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => setIsVisible(prev => !prev)}
                                className='text-muted-foreground absolute inset-y-0 right-0 rounded-s-none hover:bg-transparent'
                                type='button'
                            >
                                {isVisible ? <EyeIcon /> : <EyeOffIcon />}
                                <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                    </div>

                    <Button className='w-full bg-black text-white rounded-md' type="submit" disabled={loading}>{loading ? "Please wait..." : "Login"}</Button>
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
// ...existing code...