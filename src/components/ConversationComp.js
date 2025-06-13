import { useState } from "react";
import { PlusCircledIcon, MinusCircledIcon } from "@radix-ui/react-icons";
import userIcon from "../assets/user-icon.png";
import siteIcon from "../assets/site-icon.png";
import { useLocation } from "react-router";
import ReactMarkdown from "react-markdown";

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
              className="flex items-center gap-1 text-xs text-gray-600"
              onClick={() => setOpen((p) => !p)}
            >
              {open ? <MinusCircledIcon /> : <PlusCircledIcon />}
              Thinking
            </button>
            {open && (
              <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                <ReactMarkdown>{reasoning}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {answer && (
          <div className="prose prose-sm dark:prose-invert">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        )}
        <span className="text-xs text-gray-500">{time.split(",")[1]}</span>
      </div>
    </div>
  );
}

export default ConversationComp;
