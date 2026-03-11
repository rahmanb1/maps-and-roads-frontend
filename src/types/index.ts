export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

export interface Post {
    id: number;
    title: string;
    content: string;
    location: string;
    imageUrl: string | null;
    viewCount: number;
    likeCount: number;
    username: string;
    createdAt: string;
    updatedAt: string;
    categoryId: number | null;
    categoryName: string | null;
    categoryIcon: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Comment {
    id: number;
    content: string;
    username: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt?: string;
    replies?: Comment[];
}

export interface AuthResponse {
    token: string;
    username: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
}

export interface PostRequest {
    title: string;
    content: string;
    location: string;
    imageUrl: string | null;
    categoryId: number | null;
}