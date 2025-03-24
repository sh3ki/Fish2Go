import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, where, getDocs, setDoc 
} from "firebase/firestore";
import StaffLayout from "@/components/staff/StaffLayout";
import { Head } from "@inertiajs/react";

export default function StaffMessages() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const staffUser = "Staff"; // Identify staff user
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .filter((doc) => doc.data().seenbyadmin === false) // ✅ Only count unseen by admin
        .map((doc) => ({
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

  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const unreadMessagesQuery = query(messagesRef, where("seenbyadmin", "==", false));

    const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) => {
        setUnreadCount(snapshot.size);

        // Update seenbystaff to true for all new messages
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const messageDoc = doc(db, "messages", change.doc.id);
                setDoc(messageDoc, { seenbystaff: true, seenbyadmin: false }, { merge: true });
            }
        });
    });

    return () => unsubscribe();
  }, []);

  const handleMessagesClick = async () => {
    const messagesRef = collection(db, "messages");
    const unreadMessagesQuery = query(messagesRef, where("seenbyadmin", "==", false));

    const snapshot = await getDocs(unreadMessagesQuery);
    snapshot.forEach((doc) => {
        const messageDoc = doc.ref;
        setDoc(messageDoc, { seenbyadmin: true }, { merge: true }); // ✅ Mark as seen by admin
    });

    router.get(route('staff.messages')); // Navigate to messages page
  };

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
        seenbystaff: true, // ✅ Set to true for staff
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