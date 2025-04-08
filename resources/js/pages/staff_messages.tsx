import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc 
} from "firebase/firestore";
import StaffLayout from "@/components/staff/StaffLayout";
import { Head } from "@inertiajs/react";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt"; // Import the component

export default function StaffMessages() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);
  const staffUser = "Staff"; // Identify staff user

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(docs);

      // 🔥 Auto-scroll to the latest message
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? `Today at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
      : `${date.toLocaleDateString("en-US")} at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  };

  const sendMessage = async () => {
    if (newMessage.trim() !== "") {
      await addDoc(collection(db, "messages"), {
        user: staffUser,
        message: newMessage,
        timestamp: serverTimestamp(),
        seenbystaff: null, // ✅ Set to null for staff-created messages
        seenbyadmin: false, // ✅ Set to false for admin
      });
      setNewMessage("");

      // 🔥 Auto-scroll after sending a message
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  return (
    <StaffLayout breadcrumbs={[{ title: "Messages", href: "/staff/messages" }]}>
      <Head title="Staff Messages" />
      
      <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
      
      <div className="flex flex-col items-center gap-4 rounded-xl p-4">
        <div className="p-4 bg-gray-800 rounded-xl w-full max-w-5xl">
          <h3 className="text-lg font-semibold text-white">Admin Messages</h3>
          <br />
          <div className="h-80 overflow-y-auto bg-gray-900 p-4 rounded-lg flex flex-col">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-2 flex ${msg.user === staffUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-2 rounded-lg max-w-xs ${
                    msg.user === staffUser ? "bg-green-600 text-white self-end" : "bg-gray-700 text-white self-start"
                  }`}
                >
                  <p><strong>{msg.user}:</strong> {msg.message}</p>
                  <p className="text-xs text-gray-300 mt-1">• {formatTimestamp(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            {/* 🔥 Invisible div for auto-scroll to newest message */}
            <div ref={messagesEndRef} />
          </div>
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow p-2 border rounded-l-md"
            />
            <button onClick={sendMessage} className="bg-green-600 px-4 py-2 text-white rounded-r-md">
              Send
            </button>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
