"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from '@/types/chat';

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
      const fetchChatsAndRedirect = async () => {
        try {
          const response = await fetch('/api/chats');
          if (response.ok) {
            const chats: Chat[] = await response.json();
            if (chats.length > 0) {
              router.replace(`/chat/${chats[0].uuid}`);
            } else {
              router.replace(`/chat/${uuidv4()}`);
            }
          } else {
            router.replace(`/chat/${uuidv4()}`);
          }
        } catch (error) {
          console.error('Failed to fetch chats, creating a new one.', error);
          router.replace(`/chat/${uuidv4()}`);
        }
      };

      fetchChatsAndRedirect();
    }
  }, [status, router, session]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-body)]">
      <p>Loading...</p>
    </div>
  );
}
