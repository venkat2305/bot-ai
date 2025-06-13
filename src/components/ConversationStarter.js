function ConversationStarter({ question, subtext, onAsk }) {
  return (
    <div
      className="p-4 rounded border cursor-pointer bg-[var(--card-bg)] hover:bg-purple-50 dark:hover:bg-gray-800"
      onClick={() => onAsk(question)}
    >
      <p className="font-semibold text-sm">{question}</p>
      {subtext && (
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      )}
    </div>
  );
}

export default ConversationStarter;
