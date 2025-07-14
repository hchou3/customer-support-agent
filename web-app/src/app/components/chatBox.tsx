"use client";
import React, { useState, useRef } from "react";
import VapiProvider from "@vapi-ai/react-native";
import useVapi from "@vapi-ai/react-native";

interface Message {
  role: "User" | "Assistant";
  content: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Sorry, your browser does not support speech recognition.");
      return;
    }
    let SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setMessages((prev) => [...prev, { role: "User", content: text }]);
        setIsRecording(false);
      };
      recognitionRef.current.onerror = (event: any) => {
        setIsRecording(false);
        setTranscript("");
      };
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    if (!isRecording) {
      setTranscript("");
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-gray-800 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "User" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg p-3 max-w-xs ${
                msg.role === "User"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-200 rounded-lg p-3">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="p-4 border-t border-gray-700"
      >
        <div className="flex space-x-2 items-center">
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center justify-center bg-blue-600 text-white ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {isRecording ? (
              <span className="animate-pulse">🎤 Listening...</span>
            ) : (
              <span>🎤 Speak</span>
            )}
          </button>
          {transcript && (
            <span className="ml-4 text-gray-300">{transcript}</span>
          )}
        </div>
      </form>
    </div>
  );
}
