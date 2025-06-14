import { useState } from "react";

function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  if (inline) {
    return <code className={className}>{children}</code>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className={className}>
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-1 right-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-1 rounded"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default CodeBlock;
