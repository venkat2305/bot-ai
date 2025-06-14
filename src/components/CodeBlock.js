import { ClipboardCopyIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <pre className={className} {...props}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Copy code"
      >
        {copied ? 'Copied!' : <ClipboardCopyIcon />}
      </button>
      <code>{children}</code>
    </pre>
  );
}

export default CodeBlock;
