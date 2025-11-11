"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    if (status === 'unauthenticated') {
      signIn();
      return;
    }
    if (status === 'authenticated') {
      router.replace(`/chat/${uuidv4()}`);
    }
  }, [status, router, session]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-body)]">
      <p>Loading...</p>
    </div>
  );
}
