
import { Controller, Param, Post } from "@nestjs/common";

Controller('calls')
export class callsControllers {
    constructor(private readonly callsService : CallsService) {}
//  Calls / Live Module

//  Start call with user
  @Post('start/:userId')
  startCall(@Param('userId') userId: string) {
    return this.callsService.StartCall(userId);
  }

//    End call
@Post('end/:callId')
endCall(@Param('callId') callId: string){
    return this.callsService.EndCall(callId)
}


}