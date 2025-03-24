import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, getDocs 
} from "firebase/firestore";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";

export default function AdminMessages() {
  const [messages, setMessages] = useState<{ id: string; user: string; message: string; timestamp?: any }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any
      );

      // 🔥 Smooth auto-scroll to the latest message
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: any) => {
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
      // 🔥 Mark ALL messages as seen: false before sending new one
      const allMessages = await getDocs(collection(db, "messages"));
      allMessages.forEach(async (msg) => {
        await updateDoc(doc(db, "messages", msg.id), { seen: false });
      });

      // 🔥 Add new message
      await addDoc(collection(db, "messages"), {
        user: "Admin",
        message: newMessage,
        timestamp: serverTimestamp(),
        seenbyadmin: null, // ✅ Set to null for admin-created messages
        seenbystaff: false, // ✅ Set to false for staff
      });
      
      setNewMessage("");

      // 🔥 Auto-scroll after sending a message
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Messages", href: "/admin/messages" }]}>
      <Head title="Admin Messages" />
      <div className="flex flex-col gap-4 rounded-xl p-4">
        <div className="p-4 bg-gray-800 rounded-xl w-full max-w-5xl">
          <h3 className="text-lg font-semibold text-white">Staff Messages</h3>
          <br />
          {/* 🔥 Scrollable chat box */}
          <div className="h-80 overflow-y-auto bg-gray-900 p-4 rounded-lg flex flex-col">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-4 ${msg.user === "Admin" ? "text-right" : "text-left"}`}>
                <p className="text-sm text-gray-400 mb-1">{msg.user}</p>
                <div className={`inline-block p-3 rounded-lg max-w-xs ${msg.user === "Admin" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}>
                  <p>{msg.message}</p>
                  <p className="text-xs text-gray-300 mt-1">• {formatTimestamp(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            {/* 🔥 Invisible div to auto-scroll smoothly to the bottom */}
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
            <button onClick={sendMessage} className="bg-blue-600 px-4 py-2 text-white rounded-r-md">
              Send
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
