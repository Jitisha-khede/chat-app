import React, { useState, useEffect,useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane,faEdit } from '@fortawesome/free-solid-svg-icons';
import chatData from './chat.json';

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
  const [tripDetails, setTripDetails] = useState<{ from: string; to: string }>({from: '',to: '',});
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);


//FUNCTIONS
const loadChats = async (page: number) => {
  setLoading(true);
  const response = await fetch(`your-api-endpoint?page=${page}`); // Update endpoint with pagination params
  const newChats = await response.json();
  // Update tripDetails if necessary based on response data
  if (response.headers.has('X-Updated-Trip-Details')) {
    const updatedTripDetails = await response.json(); // Parse updated trip details from header
    setTripDetails(updatedTripDetails);
  }
  setMessages(prevMessages => [...prevMessages, ...newChats]);
  setLoading(false);
};

  useEffect(() => {
    // Extract the array of messages from chatData and set it to messages state
    if (chatData && chatData.chats && Array.isArray(chatData.chats)) {
      setMessages(chatData.chats);
      setTripDetails({ from: chatData.from, to: chatData.to });
    }

    const handleScroll = () => {
      if (chatWindowRef.current) {
        const { scrollTop} = chatWindowRef.current;
        if (scrollTop === 0 && !loading) {
          // User has scrolled to the top, load older chats
          setPageNumber(prevPageNumber => prevPageNumber + 1);
          loadChats(pageNumber); 
        }
      }
    };
  
    // Attach scroll event listener
    chatWindowRef.current?.addEventListener('scroll', handleScroll);
  
    return () => {
      // Detach scroll event listener on cleanup
      chatWindowRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [loading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}-${month}-${year}`;
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = () => {
    if (newMessage.trim() === '') {
      return; // Do not send empty messages
    }
    const generateMessageId = () => {
      // Generate a unique ID using a timestamp and a random number
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    };
    const getCurrentTime = () => {
      // Get the current date and time
      const now = new Date();
      // Format the date and time as a string
      return now.toISOString();
    };
    // Create a new message object
    const newChatMessage = {
      id: generateMessageId(), // You can use any method to generate a unique message ID
      message: newMessage,
      sender: {
       
        image: '', 
      is_kyc_verified: false, 
      self: true, 
      user_id: '', 
      },
      time:getCurrentTime(), // You can use any method to get the current time
  };
  
    // Update the chat messages state with the new message
    setMessages(prevMessages => [...prevMessages, newChatMessage]);
  
    // Clear the input field after sending the message
    setNewMessage('');
  };

  // Function to group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groupedMessages: { [date: string]: ChatMessage[] } = {};
    messages.forEach(message => {
      const date = message.time.split(' ')[0]; // Extract date from message time
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].unshift(message);
    });
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  const renderSenderLogo = (senderImage: string) => {
    return <img src={senderImage} alt="Sender Logo" className="w-6 h-6 rounded-full mr-2" />;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent submission
      sendMessage();
    }
  };
  const [inputHeight, setInputHeight] = useState<number>(0);

  useEffect(() =>{
    setInputHeight(document.getElementById('input-bar')?.clientHeight || 0);
  },[]);

  useEffect(() => {
    const handleScroll = () => {
      if (chatWindowRef.current) {
        const { scrollTop} = chatWindowRef.current;
        if (scrollTop === 0 && !loading) {
          // User has scrolled to the top, load older chats
          setPageNumber(prevPageNumber => prevPageNumber + 1);
        }
      }
    };
  
    // Attach scroll event listener
    chatWindowRef.current?.addEventListener('scroll', handleScroll);
  
    return () => {
      // Detach scroll event listener on cleanup
      chatWindowRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [loading]); // Add loading dependency to prevent multiple API calls while loading
  
  
///UI
/////////////////////////////////////////////////////////////////////////////
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white text-black py-4 px-6 items-center space-x-4"> 
        {/* Chat Title */}
        <div className="flex items-center flex-grow">
        {/* Back Button */}
        <button className="text-black mr-5">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
          <h1 className="text-xl mr-auto font-bold">{chatData.name}</h1>
            {/* Edit Button */}
            <button className="text-black ml-auto">
              <FontAwesomeIcon icon={faEdit} />
            </button>
        </div>
        <div className='"grid grid-cols-2 gap-2"'>
          <div className=' mt-4'>
            From: <span className="font-bold">{tripDetails.from}</span>
          </div>
          <div>
            To:<span className="font-bold"> {tripDetails.to}</span>
          </div>
        </div>
        {/* Placeholder for Right Side Content */}
        <div></div>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ paddingBottom: '70px' }}>
        {/* Render chat messages here */}
        <div className="flex flex-col h-screen">
          {/* Chat Messages */}
          <div>
          <div ref={chatWindowRef} className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: `calc(100vh - ${inputHeight}px)` }}>
          
            {/* Render grouped messages */}
            {Object.entries(groupedMessages).map(([date, messages]) => (
              <div key={date}>
              {/* Render date */}
                <div className="text-center text-gray-600 mb-2">{formatDate(date)}</div>
                {/* Render messages */}
                {messages.map((message, index) => (
                  <div key={message.id} className={`flex ${message.sender.self ? 'justify-end' : 'justify-start'} mb-3`}>
                    {/* Render sender's logo */}
                    {!message.sender.self && renderSenderLogo(message.sender.image)}
                    <div className={`message-container p-2 rounded-lg ${message.sender.self ? 'bg-blue-500 text-white self-message' : 'bg-gray-200 text-gray-800 other-message'}
                       ${index < messages.length - 1 ? 'mb-4' : ''}`} style={{ maxWidth: '80%' }}>
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          </div>

          {/* Message Input Bar */}
          <div className="bg-gray-200 flex items-center px-4 py-2 fixed bottom-0 left-0 w-full">
            {/* Message Input */}
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring focus:border-blue-300"
            />
            {/* Send Button */}
            <button onClick={sendMessage} className="bg-black hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
