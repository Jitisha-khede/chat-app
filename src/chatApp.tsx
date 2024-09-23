import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane, faEdit } from '@fortawesome/free-solid-svg-icons';

interface ChatMessage {
  id: string;
  message: string;
  sender: {
    image: string;
    is_kyc_verified: boolean;
    self: boolean;
    user_id: string;
  };
  time: string;
}

function ChatApp() {
  const [newMessage, setNewMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tripDetails, setTripDetails] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [pageNumber, setPageNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const loadChats = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://qa.corider.in/assignment/chat?page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();

      // Process fetched messages
      const fetchedMessages = data.chats.map((msg: ChatMessage) => ({
        ...msg,
        time: new Date(msg.time).toISOString(), // Ensure the time is in ISO format
      }));

      setMessages(prevMessages => [...fetchedMessages, ...prevMessages]);

      // Set trip details only if they are empty
      if (!from && !to) {
        setTripDetails({ from: data.from, to: data.to });
        setFrom(data.from);
        setTo(data.to);
        setName(data.name);
      }

      setLoading(false);
      scrollToBottom(); // Scroll to bottom after loading
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats(pageNumber); // Load initial chats
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = () => {
    if (newMessage.trim() === '') {
      return; // Do not send empty messages
    }
    const newChatMessage: ChatMessage = {
      id: Date.now().toString(),
      message: newMessage,
      sender: {
        image: '',
        is_kyc_verified: false,
        self: true,
        user_id: '',
      },
      time: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, newChatMessage]);
    setNewMessage(''); // Clear input field
    scrollToBottom(); // Scroll to bottom after sending a message
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groupedMessages: { [date: string]: ChatMessage[] } = {};
    messages.forEach(message => {
      const date = message.time.split('T')[0]; // Extract date from message time
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(message); // Maintain order of messages
    });
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  const handleScroll = () => {
    if (chatWindowRef.current) {
      const { scrollTop } = chatWindowRef.current;
      if (scrollTop === 0 && !loading) {
        setPageNumber(prevPageNumber => prevPageNumber + 1);
        loadChats(pageNumber + 1);
      }
    }
  };

  useEffect(() => {
    chatWindowRef.current?.addEventListener('scroll', handleScroll);
    return () => {
      chatWindowRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [loading]);

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white text-black py-4 px-6 items-center space-x-4">
        <div className="flex items-center flex-grow">
          <button className="text-black mr-5">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="text-xl mr-auto font-bold">{name}</h1>
          <button className="text-black ml-auto">
            <FontAwesomeIcon icon={faEdit} />
          </button>
        </div>
        <div className="mt-4">
          <div>
            From: <span className="font-bold">{from}</span>
          </div>
          <div>
            To: <span className="font-bold">{to}</span>
          </div>
        </div>
      </div>

      <div ref={chatWindowRef} className="flex-1 overflow-y-auto px-6 py-4" style={{ paddingBottom: '70px' }}>
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date}>
            <div className="text-center text-gray-600 mb-2">{formatDate(date)}</div>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender.self ? 'justify-end' : 'justify-start'} mb-3`}>
                {!message.sender.self && <img src={message.sender.image} alt="Sender Logo" className="w-6 h-6 rounded-full mr-2" />}
                <div className={`message-container p-2 rounded-lg ${message.sender.self ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`} style={{ maxWidth: '80%' }}>
                  {message.message}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="bg-gray-200 flex items-center px-4 py-2 fixed bottom-0 left-0 w-full">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), sendMessage())}
          placeholder="Type a message..."
          className="flex-1 rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring focus:border-blue-300"
        />
        <button onClick={sendMessage} className="bg-black hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
}

export default ChatApp;
