import { createContext, useContext, useState, type ReactNode } from 'react';

interface Message {
    role: 'user' | 'ai';
    text: string;
}

// Datos que el chat necesita saber de la página actual
interface AIContextData {
    campaignId?: string;
    mode: 'vault' | 'session';
    sessionId?: string;
}

interface ChatContextType {
    messages: Message[];
    addMessage: (msg: Message) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    clearChat: () => void;
    // Nuevos campos para manejar el contexto desde cualquier lugar
    aiContext: AIContextData;
    setAiContext: (data: AIContextData) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    // Estado por defecto
    const [aiContext, setAiContext] = useState<AIContextData>({ mode: 'vault' });

    const addMessage = (msg: Message) => {
        setMessages(prev => [...prev, msg]);
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <ChatContext.Provider value={{ messages, addMessage, isOpen, setIsOpen, clearChat, aiContext, setAiContext }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within a ChatProvider");
    return context;
};