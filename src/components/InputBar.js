function InputBar({ inputText, setInputText, onAsk, onSave }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded">
      <textarea
        className="flex-grow resize-none p-2 border rounded text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-600"
        rows={1}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (inputText !== "") {
              onAsk(inputText);
              setInputText("");
            }
          }
        }}
      />
      <button
        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-600"
        onClick={() => {
          if (inputText !== "") {
            onAsk(inputText);
            setInputText("");
          }
        }}
      >
        Ask
      </button>
      <button
        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-600"
        onClick={onSave}
      >
        Save
      </button>
    </div>
  );
}

export default InputBar;
