"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return; // Do nothing while loading
    }
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin'); // Redirect to signin if not authenticated
      return;
    }
    if (status === 'authenticated') {
      router.replace(`/chat/${uuidv4()}`);
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-body)]">
      <p>Loading...</p>
    </div>
  );
}