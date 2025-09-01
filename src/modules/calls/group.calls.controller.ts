import { Body, Controller, Param, Post } from "@nestjs/common";

Controller('group-calls')
export class callsControllers {
    constructor(private readonly groupCallsService : GroupCallsService) {}

//  Start group call
  @Post('start')
  startCall(@Body() groupCallsDto :GroupCallsDto ) {
    return this.groupCallsService.StartCall(groupCallsDto);
  }

//  End group call
  @Post('end/:id')
endCall(@Param('id') id: string){
    return this.groupCallsService.EndCall(id)
}
}

