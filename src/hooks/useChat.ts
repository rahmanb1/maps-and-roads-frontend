export interface ChatMessage {
    id: number;
    senderUsername: string;
    receiverUsername: string;
    content: string;
    fileUrl: string;
    fileType: string;
    isRead: boolean;
    isDeleted: boolean;
    createdAt: string;
    type: 'message' | 'deleted' | 'status';
    replyTo: {
        id: number;
        content: string;
        senderUsername: string;
    } | null;
}

export interface OnlineStatus {
    username: string;
    status: 'online' | 'offline';
}