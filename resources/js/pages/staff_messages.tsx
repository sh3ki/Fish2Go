import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, where,
  setDoc
} from "firebase/firestore";
import StaffLayout from "@/components/staff/StaffLayout";
import { Head, usePage } from "@inertiajs/react";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt";
import { orderBy as fbOrderBy, limit as fbLimit, onSnapshot as fbOnSnapshot, query as fbQuery, collection as fbCollection } from "firebase/firestore";

type User = { id: string; name: string; usertype: string };
type Message = {
  id: string;
  senderId: string;
  message: string;
  timestamp?: any;
  seenBy: string[];
};
type Chat = {
  id: string;
  type: "private" | "group";
  participants: string[];
  groupName?: string;
};

export default function StaffMessages() {
  const { currentUser, users } = usePage().props as { currentUser: User; users: User[] };
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupModal, setGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.id));
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
    });
    return () => unsub();
  }, [currentUser.id]);

  useEffect(() => {
    if (!selectedChat) return setMessages([]);
    const q = query(
      collection(db, "chats", selectedChat.id, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });
    return () => unsub();
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;
    const markSeen = async () => {
      const q = query(
        collection(db, "chats", selectedChat.id, "messages"),
        where("seenBy", "not-in", [currentUser.id])
      );
      const snap = await getDocs(q);
      snap.forEach(async (msg) => {
        const seenBy = msg.data().seenBy || [];
        if (!seenBy.includes(currentUser.id)) {
          await updateDoc(doc(db, "chats", selectedChat.id, "messages", msg.id), {
            seenBy: [...seenBy, currentUser.id],
          });
        }
      });
    };
    markSeen();
  }, [selectedChat, currentUser.id]);

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
    if (!selectedChat || newMessage.trim() === "") return;

    // Mark all unread messages in this chat as read by the current user before sending
    const unreadQuery = fbQuery(
      fbCollection(db, "chats", selectedChat.id, "messages"),
      where("seenBy", "not-in", [currentUser.id])
    );
    const unreadSnap = await getDocs(unreadQuery);
    for (const msg of unreadSnap.docs) {
      const seenBy = msg.data().seenBy || [];
      if (!seenBy.includes(currentUser.id)) {
        await updateDoc(doc(db, "chats", selectedChat.id, "messages", msg.id), {
          seenBy: [...seenBy, currentUser.id],
        });
      }
    }

    await addDoc(
      collection(db, "chats", selectedChat.id, "messages"),
      {
        senderId: currentUser.id,
        message: newMessage,
        timestamp: serverTimestamp(),
        seenBy: [currentUser.id],
      }
    );
    setNewMessage("");
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  // Helper to get user info by id
  const getUser = (id: string) => users.find(u => u.id === id);

  // Helper to get first name
  const getFirstName = (name: string) => name.split(" ")[0];

  const openPrivateChat = async (userId: string) => {
    let chat = chats.find(
      c => c.type === "private" &&
        c.participants.includes(userId) &&
        c.participants.includes(currentUser.id) &&
        c.participants.length === 2
    );
    if (!chat) {
      // Prevent duplicate chat creation
      const chatRef = doc(fbCollection(db, "chats"));
      await setDoc(chatRef, {
        type: "private",
        participants: [currentUser.id, userId],
      });
      chat = { id: chatRef.id, type: "private", participants: [currentUser.id, userId] };
    }
    setSelectedChat(chat);
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || groupMembers.length < 2) return;
    const chatRef = doc(fbCollection(db, "chats"));
    await setDoc(chatRef, {
      type: "group",
      participants: [currentUser.id, ...groupMembers],
      groupName,
    });
    setGroupModal(false);
    setGroupName("");
    setGroupMembers([]);
  };

  // Filter users by search
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.usertype.toLowerCase().includes(search.toLowerCase())
  );

  // Helper component for unread dot (same as admin)
  function UnreadDot({ chatId, currentUserId }: { chatId: string, currentUserId: string }) {
    const [showDot, setShowDot] = useState(false);

    useEffect(() => {
      const q = fbQuery(
        fbCollection(db, "chats", chatId, "messages"),
        fbOrderBy("timestamp", "desc"),
        fbLimit(1)
      );
      const unsub = fbOnSnapshot(q, (snap) => {
        const doc = snap.docs[0];
        if (!doc) {
          setShowDot(false);
          return;
        }
        const data = doc.data();
        if (data.senderId !== currentUserId && !(data.seenBy || []).includes(currentUserId)) {
          setShowDot(true);
        } else {
          setShowDot(false);
        }
      });
      return () => unsub();
    }, [chatId, currentUserId]);

    if (!showDot) return null;
    return (
      <span className="ml-2 flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
    );
  }

  return (
    <StaffLayout breadcrumbs={[{ title: "Messages", href: "/staff/messages" }]}>
      <Head title="Staff Messages" />
      <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
      <div className="flex flex-col bg-gray-900 h-[calc(100vh-41px)] overflow-hidden">
        <div className="flex flex-col md:flex-row gap-2 rounded-xl p-2 h-full">
          {/* User/Group List */}
          <div className="w-full md:w-1/4 bg-gray-800 rounded-xl p-3 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Chats</h3>
              <button
                className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                onClick={() => setGroupModal(true)}
              >
                + Group
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="mb-2 text-gray-400 text-xs">Users</div>
              {users.map((u: User) => {
                const privateChat = chats.find(
                  c => c.type === "private" &&
                    c.participants.includes(u.id) &&
                    c.participants.includes(currentUser.id) &&
                    c.participants.length === 2
                );
                return (
                  <div
                    key={u.id}
                    className={`cursor-pointer p-2 rounded flex items-center justify-between ${
                      selectedChat && selectedChat.type === "private" && selectedChat.participants.includes(u.id)
                        ? "bg-green-700 text-white"
                        : "hover:bg-gray-700 text-gray-200"
                    }`}
                    onClick={() => openPrivateChat(u.id)}
                  >
                    <span>
                      {u.name} <span className="text-xs text-gray-400">({u.usertype})</span>
                    </span>
                    {/* Red dot for unread */}
                    {privateChat && (
                      <UnreadDot chatId={privateChat.id} currentUserId={currentUser.id} />
                    )}
                  </div>
                );
              })}
              <div className="mt-4 mb-2 text-gray-400 text-xs">Groups</div>
              {chats.filter(c => c.type === "group").map((c) => (
                <div
                  key={c.id}
                  className={`cursor-pointer p-2 rounded flex items-center justify-between ${
                    selectedChat && selectedChat.id === c.id ? "bg-green-700 text-white" : "hover:bg-gray-700 text-gray-200"
                  }`}
                  onClick={() => setSelectedChat(c)}
                >
                  <span>{c.groupName || "Unnamed Group"}</span>
                  <UnreadDot chatId={c.id} currentUserId={currentUser.id} />
                </div>
              ))}
            </div>
          </div>
          {/* Chat Window */}
          <div className="flex-1 bg-gray-800 rounded-xl p-4 flex flex-col h-full">
            {/* Conversation Header */}
            {selectedChat && (
              <div className="mb-2 flex items-center gap-2 border-b border-gray-700 pb-2">
                {selectedChat.type === "private" ? (
                  (() => {
                    const otherId = selectedChat.participants.find(id => id !== currentUser.id);
                    const otherUser = getUser(otherId || "");
                    return otherUser ? (
                      <div>
                        <span className="font-bold text-white text-lg">{getFirstName(otherUser.name)}</span>
                        <span className="ml-2 text-xs text-gray-400">({otherUser.usertype})</span>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div>
                    <span className="font-bold text-white text-lg">{selectedChat.groupName || "Unnamed Group"}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      ({selectedChat.participants.length} members)
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-900 p-4 rounded-lg flex flex-col">
              {selectedChat ? (
                messages.map((msg) => {
                  // Seen logic
                  let seenLabel = "";
                  if (selectedChat.type === "private") {
                    const otherId = selectedChat.participants.find(id => id !== currentUser.id);
                    if (msg.senderId === currentUser.id) {
                      seenLabel = msg.seenBy.includes(otherId || "")
                        ? "✓✓ Seen"
                        : "✓ Sent";
                    }
                  } else {
                    if (msg.senderId === currentUser.id) {
                      if (msg.seenBy.length === selectedChat.participants.length) {
                        seenLabel = "✓✓ Seen by all";
                      } else if (msg.seenBy.length > 1) {
                        seenLabel = `✓✓ Seen by ${msg.seenBy.length - 1}`;
                      } else {
                        seenLabel = "✓ Sent";
                      }
                    }
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`mb-2 flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`p-2 rounded-lg max-w-xs ${
                          msg.senderId === currentUser.id
                            ? "bg-green-600 text-white self-end"
                            : "bg-gray-700 text-white self-start"
                        }`}
                      >
                        {/* Show sender name for group chats */}
                        {selectedChat.type === "group" && (
                          <div className="text-xs text-gray-300 mb-1 font-bold">{getUserName(msg.senderId)}</div>
                        )}
                        <p>{msg.message}</p>
                        <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                          • {formatTimestamp(msg.timestamp)}
                          {msg.senderId === currentUser.id && (
                            <span className="ml-2">
                              {seenLabel}
                            </span>
                          )}
                          {/* Unread dot for incoming messages */}
                          {msg.senderId !== currentUser.id && !msg.seenBy.includes(currentUser.id) && (
                            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400" title="Unread"></span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-400 text-center my-8">Select a user or group to start chatting.</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Message Input */}
            {selectedChat && (
              <div className="mt-4 flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow p-2 border rounded-l-md"
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} className="bg-green-600 px-4 py-2 text-white rounded-r-md">
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Group Modal */}
        {groupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="relative bg-gray-800 px-4 py-3 rounded-xl shadow-2xl max-w-md w-full mt-10 max-h-[90vh] overflow-y-auto z-50 border border-gray-600"
              onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setGroupModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-300 transition-colors z-55"
              >
                ×
              </button>
              <div className="relative mb-4">
                <h2 className="text-xl font-bold text-white text-center">
                  Create Group
                </h2>
              </div>
              <label className="block mb-2 text-sm font-medium text-gray-200">Group Name</label>
              <input
                className="w-full border border-gray-600 rounded px-3 py-2 mb-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Group Name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <label className="block mb-2 text-sm font-medium text-gray-200">Add Members</label>
              <input
                className="w-full border border-gray-600 rounded px-3 py-2 mb-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="max-h-40 overflow-y-auto border border-gray-600 rounded mb-4 bg-gray-700">
                {filteredUsers.length === 0 && (
                  <div className="p-2 text-gray-400 text-sm">No users found.</div>
                )}
                {filteredUsers.map(u => (
                  <label key={u.id} className="flex items-center px-3 py-2 hover:bg-green-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupMembers.includes(u.id)}
                      onChange={e => {
                        if (e.target.checked) setGroupMembers([...groupMembers, u.id]);
                        else setGroupMembers(groupMembers.filter(id => id !== u.id));
                      }}
                      className="mr-2"
                    />
                    <span className="font-medium text-white">{u.name}</span>
                    <span className="ml-2 text-xs text-gray-400">({u.usertype})</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                  onClick={createGroupChat}
                  disabled={!groupName.trim() || groupMembers.length < 2}
                >
                  Create
                </button>
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded font-semibold"
                  onClick={() => setGroupModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
