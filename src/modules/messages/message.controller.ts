// import { Body, Controller, Get, Param, Post } from "@nestjs/common";

// Controller('messages')
// export class MessageController {
//     constructor(private readonly messageServies: MessageService) { }

//     // Send message
//     @Post(':userId')
//     sendMessage(@Param('userId') userId: string) {
//         return this.messageServies.sendMessage(userId)
//     }

//     //  Fetch chat history
//     @Get(':userId')
//     FetchChatHistory(@Param('userId') userId: string) {
//         return this.messageServies.FetchChatHistory(userId)
//     }
// }