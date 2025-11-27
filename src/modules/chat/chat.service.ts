import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { Chat } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatSession)
        private readonly chatSessionRepo: Repository<ChatSession>,

        @InjectRepository(Chat)
        private readonly chatRepo: Repository<Chat>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async createSession(senderId: string, receiverId: string) {
        let existingSession = await this.chatSessionRepo.findOne({
            where: [
                { user1: { id: senderId }, user2: { id: receiverId } },
                { user1: { id: receiverId }, user2: { id: senderId } },
            ],
            relations: ['messages', 'user1', 'user2'],
        });

        if (existingSession) return existingSession;

        const sender = await this.userRepo.findOneBy({ id: senderId });
        const receiver = await this.userRepo.findOneBy({ id: receiverId });

        if (!sender || !receiver) {
            throw new NotFoundException('Sender or receiver not found');
        }

        const session = this.chatSessionRepo.create({
            user1: sender,
            user2: receiver,
        });

        return this.chatSessionRepo.save(session);
    }

    // async getUserSessionsWithLatestMessage(userId: string) {
    //     const sessions = await this.chatSessionRepo.find({
    //         where: [
    //             { user1: { id: userId } },
    //             { user2: { id: userId } },
    //         ],
    //         relations: ['user1', 'user2', 'messages'],
    //         order: { created_at: 'DESC' },
    //     });
    //     return sessions.map(session => {
    //         const latestMessage = session.messages?.sort(
    //             (a, b) => b.created_at.getTime() - a.created_at.getTime()
    //         )[0];

    //         return {
    //             sessionId: session.session_id,
    //             user1: { id: session.user1.id, username: session.user1.username },
    //             user2: { id: session.user2.id, username: session.user2.username },
    //             createdAt: session.created_at,
    //             latestMessage: latestMessage
    //                 ? {
    //                     chatId: latestMessage.chat_id,
    //                     sender: {
    //                         id: latestMessage.sender.id,
    //                         username: latestMessage.sender.username,
    //                     },
    //                     text: latestMessage.message_text,
    //                     createdAt: latestMessage.created_at,
    //                 }
    //                 : null,
    //         };
    //     });
    // }

    async getUserSessionsWithLatestMessage(userId: string) {
    const sessions = await this.chatSessionRepo.find({
        where: [
            { user1: { id: userId } },
            { user2: { id: userId } },
        ],
        relations: ['user1', 'user1.userProfile', 'user2', 'user2.userProfile', 'messages', 'messages.sender', 'messages.sender.userProfile'],
        order: { created_at: 'DESC' },
    });

    return sessions
        .filter(session => session.user1 && session.user2)
        .map(session => {
            // Determine the "other" user
            const otherUser = session.user1.id === userId ? session.user2 : session.user1;
            
            const latestMessage = session.messages?.sort(
                (a, b) => b.created_at.getTime() - a.created_at.getTime()
            )[0];

            return {
                sessionId: session.session_id,
                otherUser: { 
                    id: otherUser.id, 
                    username: otherUser.username,
                    profilePicture: otherUser.userProfile?.ProfilePicture || ''
                },
                createdAt: session.created_at,
                latestMessage: latestMessage && latestMessage.sender
                    ? {
                        chatId: latestMessage.chat_id,
                        sender: {
                            id: latestMessage.sender.id,
                            username: latestMessage.sender.username,
                            profilePicture: latestMessage.sender.userProfile?.ProfilePicture || ''
                        },
                        text: latestMessage.message_text,
                        createdAt: latestMessage.created_at,
                    }
                    : null,
            };
        });
}

    async deleteSession(userId: string, sessionId: number) {
        const session = await this.chatSessionRepo.findOne({
            where: { session_id: sessionId },
            relations: ['user1', 'user2'],
        });

        if (!session) throw new NotFoundException('Session not found');

        if (session.user1.id !== userId && session.user2.id !== userId) {
            throw new ForbiddenException('Not authorized to delete this session');
        }

        return this.chatSessionRepo.remove(session);
    }
    async sendMessage(senderId: string, sessionId: number, text: string) {
        const session = await this.chatSessionRepo.findOne({
            where: { session_id: sessionId },
            relations: ['user1', 'user2'],
        });
        if (!session) throw new NotFoundException('Chat session not found');

        const sender = await this.userRepo.findOneBy({ id: senderId });
        if (!sender) throw new NotFoundException('Sender not found');

        const chat = this.chatRepo.create({
            session,
            sender,
            message_text: text,
        });

        return this.chatRepo.save(chat);
    }

    // async getSessionMessages(sessionId: number, limit?: number) {
    //     const session = await this.chatSessionRepo.findOne({
    //         where: { session_id: sessionId },
    //     });
    //     if (!session) throw new NotFoundException('Chat session not found');
    //     const oneDayAgo = new Date();
    //     oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    //     return this.chatRepo.find({
    //         where: {
    //             session: { session_id: sessionId },
    //             created_at: MoreThan(oneDayAgo),
    //         },
    //         order: { created_at: 'ASC' },
    //     });
    // }

    async getSessionMessages(sessionId: number, limit?: number) {
        const session = await this.chatSessionRepo.findOne({
            where: { session_id: sessionId },
        });
        if (!session) throw new NotFoundException('Chat session not found');

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        return this.chatRepo.find({
            where: {
                session: { session_id: sessionId },
                // created_at: MoreThan(oneDayAgo),
            },
            relations: ['sender'],
            order: { created_at: 'ASC' },
        });
    }

    async deleteMessageForMe(userId: string, messageId: string) {
        const id = Number(messageId);

        if (!id || isNaN(id)) {
            throw new BadRequestException("Invalid messageId");
        }

        const chat = await this.chatRepo.findOne({
            where: { chat_id: id },
        });

        if (!chat) throw new NotFoundException('Message not found');

        chat.deleted_for = chat.deleted_for ?? [];

        if (!chat.deleted_for.includes(userId)) {
            chat.deleted_for.push(userId);
        }

        await this.chatRepo.save(chat);
        return { success: true, messageId: id };
    }

    async deleteMessageForEveryone(userId: string, messageId: string) {
        const id = Number(messageId);

        if (!id || isNaN(id)) {
            throw new BadRequestException("Invalid messageId");
        }

        const chat = await this.chatRepo.findOne({
            where: { chat_id: id },
            relations: ['sender'],
        });

        if (!chat) throw new NotFoundException('Message not found');

        if (chat.sender.id !== userId) {
            throw new ForbiddenException('Only sender can delete for everyone');
        }

        await this.chatRepo.remove(chat);
        console.log('✅ Message deleted successfully:', id);

        return { success: true, messageId: id };
    }

}
