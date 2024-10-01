import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  name: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function MentionInput({
  value,
  onChange,
  containerRef,
}: MentionInputProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<User[]>([]);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    const lastAtSymbol = newValue.lastIndexOf("@", cursorPos);
    if (lastAtSymbol !== -1 && cursorPos - lastAtSymbol <= 15) {
      setMentionSearch(newValue.slice(lastAtSymbol + 1, cursorPos));
      setShowMentions(true);
      updatePopupPosition(lastAtSymbol);
    } else {
      setShowMentions(false);
    }
  };

  const updatePopupPosition = (atSymbolIndex: number) => {
    if (textareaRef.current && containerRef.current) {
      const textareaRect = textareaRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const textBeforeAtSymbol = value.slice(0, atSymbolIndex);
      const dummyElem = document.createElement("div");
      dummyElem.style.position = "absolute";
      dummyElem.style.visibility = "hidden";
      dummyElem.style.whiteSpace = "pre-wrap";
      dummyElem.style.font = window.getComputedStyle(textareaRef.current).font;
      dummyElem.textContent = textBeforeAtSymbol;
      document.body.appendChild(dummyElem);

      const atSymbolPosition = dummyElem.getBoundingClientRect();
      document.body.removeChild(dummyElem);

      const top = atSymbolPosition.height - textareaRef.current.scrollTop;
      const left = atSymbolPosition.width % textareaRect.width;

      setPopupPosition({
        top: top + textareaRect.top - containerRect.top,
        left: left + textareaRect.left - containerRect.left,
      });
    }
  };

  const handleMentionClick = (user: User) => {
    const beforeMention = value.slice(
      0,
      value.lastIndexOf("@", cursorPosition)
    );
    const afterMention = value.slice(cursorPosition);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    onChange(newValue);
    setShowMentions(false);
    setMentions([...mentions, user]);
    textareaRef.current?.focus();
  };

  const renderContent = () => {
    let result = value;
    mentions.forEach((user) => {
      const regex = new RegExp(`@${user.name}\\b`, "g");
      result = result.replace(
        regex,
        `<span class="inline-block bg-primary text-primary-foreground rounded px-1 py-0.5 text-sm font-semibold mr-1">@${user.name}</span>`
      );
    });
    return result
      .split("\n")
      .map((line, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }} />
      ));
  };

  return (
    <div className="relative">
      <div className="relative border rounded-md p-2 min-h-[12rem]">
        <div className="invisible whitespace-pre-wrap break-words">
          {renderContent()}
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          className="absolute inset-0 bg-transparent resize-none"
          style={{ caretColor: "black" }}
          placeholder="Enter your note here... Use @ to mention users"
        />
      </div>
      {showMentions && (
        <div
          className="absolute bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto z-10"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            transform: "translateY(-100%)",
          }}
        >
          {users
            .filter((user) =>
              user.name.toLowerCase().includes(mentionSearch.toLowerCase())
            )
            .map((user) => (
              <div
                key={user.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleMentionClick(user)}
              >
                {user.name}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
