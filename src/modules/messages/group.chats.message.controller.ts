import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";

Controller('group')
export class GroupChatMessage{
    constructor(private readonly groupcChatMessageService : GroupcChatMessageService) { }

    // Group Chats

    // Create group chat
    @Post()
    async createGroupChat(@Body() createGroupChatsMessageDto: CreateGroupChatsMessageDto) {
    return this.groupcChatMessageService.createGroupChat(createGroupChatsMessageDto)
}

//  Send group message
    @Post(':id/messages')
    async sendGroupMessage(@Body('id') id: string) {
    return this.groupcChatMessageService.sendGroupMessage(id)
}

 // Get all group messages
  @Get(':id/messages')
 getGroupMessages(@Param('id') id: string) {
    return this.groupcChatMessageService.getMessages(id);
  }


  // Add member to group
  @Post(':id/members')
   addMember(@Param('id') id: number) {
    return this.groupcChatMessageService.addMember(id);
  }
  
  // Remove member from group
  @Delete(':id/members/:userId')
 removeMember( @Param('id') id:string ,
   @Param('userId') userId: string){
    return this.groupcChatMessageService.removeMember(id, userId);
  }
}