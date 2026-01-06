import { Inject, Injectable } from '@nestjs/common';
import { Bot, InlineKeyboard } from 'grammy';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class BotService {
  private bot: Bot;
  private readonly CHANNEL_ID =
    process.env.TELEGRAM_CHANNEL_ID || '-1003684753121';
  private readonly CHANNEL_USERNAME =
    process.env.TELEGRAM_CHANNEL_USERNAME || 'streakuz';

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

  get getBot() {
    return this.bot;
  }

  private async checkChannelSubscription(userId: number): Promise<boolean> {
    try {
      const member = await this.bot.api.getChatMember(this.CHANNEL_ID, userId);
      return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (error) {
      console.error('Kanal obunasini tekshirishda xatolik:', error);
      return false;
    }
  }

  setCommands() {
    // Kanal ID ni olish uchun (test)
    this.bot.on('channel_post', async (ctx) => {
      console.log('═══════════════════════════════');
      console.log('KANAL ID:', ctx.chat.id);
      console.log('KANAL USERNAME:', ctx.chat.username);
      console.log('KANAL TITLE:', ctx.chat.title);
      console.log('═══════════════════════════════');
    });

    this.bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const isSubscribed = await this.checkChannelSubscription(userId);

      if (!isSubscribed) {
        const keyboard = new InlineKeyboard()
          .url(
            "📢 Kanalga obuna bo'lish",
            `https://t.me/${this.CHANNEL_USERNAME}`,
          )
          .row()
          .text("✅ Obuna bo'ldim", 'check_subscription');

        await ctx.reply(
          "⚠️ Botdan foydalanish uchun avval kanalimizga obuna bo'ling!\n\n" +
            "👇 Pastdagi tugma orqali kanalga o'ting va obuna bo'ling, keyin \"Obuna bo'ldim\" tugmasini bosing.",
          {
            reply_markup: keyboard,
          },
        );
        return;
      }

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

    this.bot.callbackQuery('check_subscription', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const isSubscribed = await this.checkChannelSubscription(userId);

      if (!isSubscribed) {
        await ctx.answerCallbackQuery({
          text: "❌ Siz hali kanalga obuna bo'lmadingiz!",
          show_alert: true,
        });
        return;
      }

      await ctx.answerCallbackQuery({
        text: '✅ Obuna tasdiqlandi!',
      });

      const keyboard = new InlineKeyboard().webApp(
        '🌐 Saytni ochish',
        'https://streak.uz/docs',
      );

      await ctx.editMessageText(
        '👋 Assalomu alaykum!\n\n' +
          '🎯 Streak.uz platformasiga xush kelibsiz!\n\n' +
          "🌐 Saytga o'tish uchun pastdagi tugmani bosing va Telegram orqali ro'yxatdan o'ting!",
        {
          reply_markup: keyboard,
        },
      );
    });

    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '📖 Yordam:\n\n' +
          "/start - Botni ishga tushirish va saytga o'tish\n" +
          '/help - Bu yordam xabari\n\n' +
          "💡 Saytga o'tib, Telegram orqali ro'yxatdan o'ting!",
      );
    });

    this.bot.on('message:text', async (ctx) => {
      const message = ctx.msg;
      const userId = ctx.from?.id;
      if (!userId) return;

      const isSubscribed = await this.checkChannelSubscription(userId);

      if (!isSubscribed) {
        const keyboard = new InlineKeyboard()
          .url(
            "📢 Kanalga obuna bo'lish",
            `https://t.me/${this.CHANNEL_USERNAME}`,
          )
          .row()
          .text("✅ Obuna bo'ldim", 'check_subscription');

        await ctx.reply(
          "⚠️ Botdan foydalanish uchun avval kanalimizga obuna bo'ling!",
          {
            reply_markup: keyboard,
          },
        );
        return;
      }

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

  async verifyTelegramAuth(authData: any): Promise<any> {
    const { hash, ...data } = authData;

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
