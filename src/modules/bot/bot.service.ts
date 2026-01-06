import { Inject, Injectable } from '@nestjs/common';
import { Bot, InlineKeyboard } from 'grammy';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class BotService {
  private bot: Bot;

  constructor(private readonly userService: UserService) {
    this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

    console.log(process.env.TELEGRAM_BOT_TOKEN);

    this.bot.start();

    this.bot.api.setMyCommands([
      { command: 'start', description: 'Botni ishga tushirish' },
      { command: 'help', description: 'Yordam' },
    ]);

    this.setCommands();
  }

  // Bot instance ni olish uchun getter
  get getBot() {
    return this.bot;
  }

  setCommands() {
    // START command - saytga yo'naltirish
    this.bot.command('start', async (ctx) => {
      const keyboard = new InlineKeyboard().webApp(
        '🌐 Saytni ochish',
        'https://streak.uz/docs',
      );

      await ctx.reply(
        '👋 Assalomu alaykum!\n\n' +
          '🎯 Streak.uz platformasiga xush kelibsiz!\n\n' +
          "🌐 Saytga o'tish uchun pastdagi tugmani bosing va Telegram orqali ro'yxatdan o'ting!",
        {
          reply_markup: keyboard,
        },
      );
    });

    // HELP command
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '📖 Yordam:\n\n' +
          "/start - Botni ishga tushirish va saytga o'tish\n" +
          '/help - Bu yordam xabari\n\n' +
          "💡 Saytga o'tib, Telegram orqali ro'yxatdan o'ting!",
      );
    });

    // Telegram orqali ro'yxatdan o'tish - webhook dan keladi
    this.bot.on('message:text', async (ctx) => {
      const message = ctx.msg;

      try {
        const existingUser = await this.userService.findByTelegramId(
          String(message.chat.id),
        );

        if (!existingUser) {
          await this.userService.create({
            firstName: message.chat.first_name,
            lastName: message.chat.last_name,
            nickname: message.chat.username,
            telegramId: String(message.chat.id),
          } as CreateUserDto);

          await ctx.reply("✅ Siz muvaffaqiyatli ro'yxatdan o'tdingiz!");
        } else {
          await ctx.reply("ℹ️ Siz allaqachon ro'yxatdan o'tgansiz!");
        }
      } catch (error) {
        console.error('User saqlashda xatolik:', error);
        await ctx.reply(
          "❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
        );
      }
    });
  }

  // Telegram ma'lumotlarini tekshirish uchun method
  async verifyTelegramAuth(authData: any): Promise<any> {
    const { hash, ...data } = authData;

    // Telegram ma'lumotlarini tekshirish logikasi
    // Bu method auth controller dan chaqiriladi

    const user = await this.userService.findOrCreateByTelegram({
      telegramId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      photoUrl: data.photo_url,
    });

    return user;
  }
}
