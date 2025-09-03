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
import { registerUser } from '@/hooks/users/user';

export default function RegisterForm() {
    useRedirectIfAuth();
    const [isVisible, setIsVisible] = useState(false)
    const id = useId()
    const router = useRouter();

    const [fullname, setFullname] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullname || !username || !password) {
            alert("Please fill all fields");
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await registerUser({ fullname, username, password });
            alert("Registration successful — please login");
            router.push("/login");
        } catch (err: any) {
            // prefer server-provided message (e.g. "Username already taken")
            const msg = err?.response?.data?.message || err?.message || "Registration failed";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-full max-w-sm flex flex-col items-center gap-6 pb-[10px] px-2">
                <div className="flex flex-col items-center gap-2">
                    <Image src="/img/logo1.png" alt="App logo" width={150} height={150} />
                    <p className="font-bold text-2xl">Register</p>
                </div>

                <form className='w-full space-y-4' onSubmit={onSubmit}>
                    <div className='w-full'>
                        <Label htmlFor={`${id}-fullname`} className='text-sm'>Fullname</Label>
                        <div className='relative mt-1'>
                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center ps-3'>
                                <UserIcon className='w-4 h-4' />
                            </div>
                            <Input id={`${id}-fullname`} type='text' placeholder='Fullname' className='peer ps-9' value={fullname} onChange={(e) => setFullname(e.target.value)} />
                        </div>
                    </div>
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
                    <div className='w-full'>
                        <Label htmlFor={`${id}-confirm`} className='text-sm'>Confirm Password</Label>
                        <div className='relative mt-1'>
                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center ps-3'>
                                <KeyRound className='w-4 h-4' />
                                <span className='sr-only'>Confirm Password</span>
                            </div>
                            <Input id={`${id}-confirm`} type={isVisible ? 'text' : 'password'} placeholder='Confirm Password' className='peer ps-9' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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

                    <Button className='w-full bg-black text-white rounded-md' type="submit" disabled={loading}>{loading ? "Please wait..." : "Register"}</Button>
                </form>

                <div className="text-center text-sm mt-2">
                    Already have an account?{" "}
                    <a href="/login" className="underline underline-offset-4">
                        Sign In
                    </a>
                </div>
            </div>
        </div>
    );
}
// ...existing code...