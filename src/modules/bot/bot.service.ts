import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot, InlineKeyboard } from 'grammy';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Bot;

  private readonly CHANNEL_USERNAME =
    process.env.TELEGRAM_CHANNEL_USERNAME || 'streakuz';

  constructor(private readonly userService: UserService) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined!');
    }
    this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  }

  get getBot() {
    return this.bot;
  }

  /** 🔹 Bot faqat BIR marta ishga tushadi */
  async onModuleInit() {
    try {
      await this.bot.api.deleteWebhook({ drop_pending_updates: true });

      await this.bot.api.setMyCommands([
        { command: 'start', description: 'Botni ishga tushirish' },
        { command: 'help', description: 'Yordam' },
      ]);

      this.setCommands();

      // Bot xatolarini tutish
      this.bot.catch((err) => {
        console.error('❌ Bot Error:', err.error);
      });

      // Botni ishga tushurish (async, serverni bloklamaydi)
      this.bot.start();
      console.log('🤖 Bot started');
    } catch (err) {
      console.error('BotService onModuleInit error:', err);
    }
  }

  /** 🔹 PUBLIC kanal obunasini tekshirish */
  private async checkChannelSubscription(userId: number): Promise<boolean> {
    try {
      const member = await this.bot.api.getChatMember(
        `@${this.CHANNEL_USERNAME}`,
        userId,
      );
      return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (error: any) {
      console.error(
        'SUB CHECK ERROR:',
        error?.description || error?.message || error,
      );
      return false;
    }
  }

  /** 🔹 Bot komandalarini sozlash */
  private setCommands() {
    // /start komandasi
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const isSubscribed = await this.checkChannelSubscription(userId);
      if (!isSubscribed) {
        const keyboard = new InlineKeyboard()
          .url(
            '📢 Kanalga obuna bo‘lish',
            `https://t.me/${this.CHANNEL_USERNAME}`,
          )
          .row()
          .text('✅ Obuna bo‘ldim', 'check_subscription');

        await ctx.reply(
          '⚠️ Botdan foydalanish uchun avval kanalimizga obuna bo‘ling!',
          { reply_markup: keyboard },
        );
        return;
      }

      await this.sendWelcome(ctx);
    });

    // Obuna tekshirish tugmasi
    this.bot.callbackQuery('check_subscription', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      await new Promise((r) => setTimeout(r, 1500));

      const isSubscribed = await this.checkChannelSubscription(userId);
      if (!isSubscribed) {
        await ctx.answerCallbackQuery({
          text: '❌ Siz hali kanalga obuna bo‘lmadingiz!',
          show_alert: true,
        });
        return;
      }

      await ctx.answerCallbackQuery({ text: '✅ Obuna tasdiqlandi!' });
      await this.sendWelcome(ctx, true);
    });

    // /help komandasi
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '📖 Yordam:\n\n/start - Botni ishga tushirish\n/help - Yordam',
      );
    });

    // Matn xabarlari
    this.bot.on('message:text', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const isSubscribed = await this.checkChannelSubscription(userId);
      if (!isSubscribed) return;

      const chat = ctx.chat;
      const existingUser = await this.userService.findByTelegramId(
        String(chat.id),
      );

      if (!existingUser) {
        await this.userService.create({
          telegramId: String(chat.id),
          firstName: chat.first_name,
          lastName: chat.last_name,
          nickname: chat.username,
        } as CreateUserDto);

        await ctx.reply('✅ Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz!');
      } else {
        await ctx.reply('ℹ️ Siz allaqachon ro‘yxatdan o‘tgansiz!');
      }
    });
  }

  /** 🔹 Welcome xabar */
  private async sendWelcome(ctx: any, edit = false) {
    const keyboard = new InlineKeyboard().webApp(
      '🌐 Saytni ochish',
      'https://streak.uz/docs',
    );

    const text =
      '👋 Assalomu alaykum!\n\n🎯 Streak.uz platformasiga xush kelibsiz!\n\n🌐 Saytga o‘tish uchun pastdagi tugmani bosing.';

    if (edit) {
      await ctx.editMessageText(text, { reply_markup: keyboard });
    } else {
      await ctx.reply(text, { reply_markup: keyboard });
    }
  }
}
