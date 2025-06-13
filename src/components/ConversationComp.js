import { useState } from "react";
import { PlusCircledIcon, MinusCircledIcon } from "@radix-ui/react-icons";
import userIcon from "../assets/user-icon.png";
import siteIcon from "../assets/site-icon.png";
import { useLocation } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function parseThink(text) {
  const start = text.indexOf("<think>");
  const end = text.indexOf("</think>");
  let reasoning = "";
  let answer = text;
  let inProgress = false;

  if (start !== -1) {
    if (end !== -1 && end > start) {
      reasoning = text.slice(start + 7, end);
      answer = (text.slice(0, start) + text.slice(end + 8)).trim();
    } else {
      reasoning = text.slice(start + 7);
      answer = text.slice(0, start).trim();
      inProgress = true;
    }
  }

  return { reasoning, answer, inProgress };
}

function ConversationComp({ who, quesAns, time }) {
  const location = useLocation();
  const past = location.pathname === "/past-coversation";
  const { reasoning, answer } = parseThink(quesAns);
  const style = past
    ? ""
    : "bg-[var(--bubble-bg)] rounded shadow p-3 my-1";
  const [open, setOpen] = useState(false);

  return (
    <div className={`flex gap-3 ${style}`}>
      <div className="w-20 shrink-0">
        <img src={who === "user" ? userIcon : siteIcon} alt="icon" />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <strong className="text-base">{who}</strong>
        {reasoning && (
          <div>
            <button
              className="flex items-center gap-1 text-xs text-gray-800 dark:text-gray-300"
              onClick={() => setOpen((p) => !p)}
            >
              {open ? <MinusCircledIcon /> : <PlusCircledIcon />}
              <svg
                className="w-3 h-3 animate-spin ml-1 text-purple-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z"
                />
              </svg>
              Thinking
            </button>
            {open && (
              <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoning}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {answer && (
          <div className="prose prose-sm dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
        )}
        <span className="text-xs text-gray-500">{time.split(",")[1]}</span>
      </div>
    </div>
  );
}

export default ConversationComp;
