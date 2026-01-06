import { Body, Controller, Post, Res } from '@nestjs/common';
import { BotService } from './bot.service';
import { Response } from 'express';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('webhook')
  async webHook(@Body() dto: any, @Res() response: Response) {
    try {
      await this.botService.getBot.handleUpdate(dto);
      response.sendStatus(200);
    } catch (error) {
      console.error('Webhook error:', error);
      response.sendStatus(500);
    }
  }
}
