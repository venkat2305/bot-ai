import { PlusCircledIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext } from 'react';
import { NewChatContext } from '../context/NewChatContext';

function SideBar({ onToggleTheme, themeMode }) {
  const router = useRouter();
  const { handleNewChat } = useContext(NewChatContext);

  const handleNewChatClick = () => {
    handleNewChat();
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-5 text-sm">
      <button
        className="flex items-center gap-2 px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
        onClick={handleNewChatClick}
      >
        <PlusCircledIcon />
        New Chat
      </button>
      <Link href="/past-coversation" className="w-full">
        <button className="w-full px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600">
          <strong>Past Conversations</strong>
        </button>
      </Link>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={themeMode === 'dark'}
          onChange={onToggleTheme}
        />
        {themeMode === 'dark' ? 'Dark' : 'Light'}
      </label>
    </div>
  );
}

export default SideBar;
