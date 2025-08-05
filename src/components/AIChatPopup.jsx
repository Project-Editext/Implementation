"use client";
import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { Resizable } from "react-resizable";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Add CSS for resize handle
import "react-resizable/css/styles.css";

export default function AIChatPopup({ documentContent }) {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hi! I'm your document assistant. Ask me anything about this document." 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  
  // Create a ref for the draggable node
  const draggableRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send to API
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: input,
          documentContent 
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.answer 
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onResize = (event, { size }) => {
    setDimensions({ width: size.width, height: size.height });
  };

  return (
    <Draggable handle=".handle" nodeRef={draggableRef}>
      <Resizable 
        width={dimensions.width} 
        height={dimensions.height}
        onResize={onResize}
        minConstraints={[300, 300]}
        maxConstraints={[800, 600]}
        resizeHandles={['se']} // Only show resize handle at bottom-right
      >
        <div 
          ref={draggableRef}
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden flex flex-col relative"
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        >
          <div className="handle bg-gray-800 text-white p-2 flex justify-between items-center cursor-move">
            <h3 className="font-bold">Editext Assistant</h3>
            <button onClick={() => document.getElementById('ai-chat-button')?.click()}>
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}
              >
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  msg.role === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-800"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center">
                <div className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="border-t border-gray-300 p-2 flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none"
              placeholder="Ask about the document..."
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-r disabled:bg-gray-300"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
          
          {/* Custom resize handle - placed inside the container */}
          <div className="react-resizable-handle react-resizable-handle-se absolute bottom-0 right-0 w-4 h-4 bg-gray-300 cursor-se-resize"></div>
        </div>
      </Resizable>
    </Draggable>
  );
}