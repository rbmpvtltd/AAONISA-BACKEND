import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('User') // Group this controller under "User" section
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Users Module

  //  Get user profilei
  @Get(':id')
getUserProfile(@Param('id') id: number){
  return userService.getUserProfile(id)
}

//  List all users (with filters, pagination)
 @Get()
listAllUsers(){
  return userService.listAllUsers()
}

  @Put(':id')
updateUserProfile(@Param('id') id : number){
  // return this.userService.updateUserProfile(id)
}

// Update partial profile (bio, username, etc.)
@Patch('id')
updatePartialProfile(@Param('id') id:number  { }){
  return this.userService.updatePartialProfile(id , '  ' )
} 

// Delete user
@Delete(':id')
deleteUser(@Param('id') id : number){
  return this.userService.deleteUser(id)
}

// Profile Media

// Upload/change avatar
@Post(':avatar')
uploadChangeAvatar(@Param("avatar") avatar : number){
  return  this.userService.uploadChangeAvatar(avatar)
}

// Upload/change cover photo
@Post(':cover')
uploadChangeCoverPhoto(@Param('cover') cover: string){
  return this.userService.uploadChangeCoverPhoto(cover)
}

// Follow System

// Follow a user
@Post(':id/follow')
followUser(@Param('id') id : number){
  return  this.userService.followUser(id)
}

// Unfollow a user
@Delete(':id/follow')
unfollowUser(@Param('id') id: number){
  return this.userService.unfollowUser(id)
}

//  Get followers
@Get(':id/followers')
getFollowers(@Param('id') id:number){
  return this.userService.getFollowers(id)
}

//  Get following
@Get(':id/following ')
getFollowing(@Param('id') id : number){
  return this.userService.getFollowing(id)
}
}




  // @Post()
  // @ApiOperation({ summary: 'Create a new user' })
  // @ApiBody({ type: CreateUserDto })
  // @ApiResponse({ status: 201, description: 'User created successfully',  })
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }
  
  // @Get()
  // @ApiOperation({ summary: 'Get all users' })
  // @ApiResponse({ status: 200, description: 'List of users returned' })
  // findAll() {
  //   // console.log("request comes here")
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get a single user by ID' })
  // @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  // @ApiResponse({ status: 200, description: 'User found' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(+id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update a user by ID' })
  // @ApiParam({ name: 'id', type: Number })
  // @ApiBody({ type: UpdateUserDto })
  // @ApiResponse({ status: 200, description: 'User updated' })
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a user by ID' })
  // @ApiParam({ name: 'id', type: Number })
  // @ApiResponse({ status: 200, description: 'User deleted' })
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(+id);
  // }