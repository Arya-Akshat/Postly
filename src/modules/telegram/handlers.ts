import { bot } from './bot';
import { TelegramSession } from './session';
import { InlineKeyboard } from 'grammy';
import { AiEngineService } from '../ai/ai-engine.service';
import { prisma } from '../../db/prisma';

if (bot) {
  bot.command('start', async (ctx) => {
    await TelegramSession.clear(ctx.chat.id);
    const kb = new InlineKeyboard()
      .text('Announcement', 'type:ANNOUNCEMENT').text('Thread', 'type:THREAD').row()
      .text('Story', 'type:STORY').text('Promotional', 'type:PROMOTIONAL').row()
      .text('Educational', 'type:EDUCATIONAL').text('Opinion', 'type:OPINION');
    
    await TelegramSession.set(ctx.chat.id, { step: 'POST_TYPE' });
    await ctx.reply('Welcome to Postly AI! Let\'s create a post.\nChoose a post type:', { reply_markup: kb });
  });

  bot.on('callback_query:data', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const data = ctx.callbackQuery.data;
    const session = await TelegramSession.get(chatId);

    if (!session) {
      await ctx.answerCallbackQuery('Session expired.');
      return ctx.reply('Your session expired. Type /start to begin again.');
    }

    if (data.startsWith('type:')) {
      session.postType = data.split(':')[1];
      session.step = 'PLATFORMS';
      session.platforms = [];
      await TelegramSession.set(chatId, session);

      const kb = new InlineKeyboard()
        .text('Twitter ❌', 'plat:TWITTER').text('LinkedIn ❌', 'plat:LINKEDIN').row()
        .text('Instagram ❌', 'plat:INSTAGRAM').text('Threads ❌', 'plat:THREADS').row()
        .text('🧪 Test ❌', 'plat:TEST').row()
        .text('Next ➡️', 'plat:NEXT');
      
      await ctx.editMessageText('Select platforms to publish to:', { reply_markup: kb });
    } else if (data.startsWith('plat:')) {
      const plat = data.split(':')[1];
      if (plat === 'NEXT') {
        if (!session.platforms.length) {
          return ctx.answerCallbackQuery('Select at least one platform.');
        }
        session.step = 'TONE';
        await TelegramSession.set(chatId, session);
        const kb = new InlineKeyboard()
          .text('Professional', 'tone:PROFESSIONAL').text('Casual', 'tone:CASUAL').row()
          .text('Witty', 'tone:WITTY').text('Authoritative', 'tone:AUTHORITATIVE').row()
          .text('Friendly', 'tone:FRIENDLY');
        await ctx.editMessageText('Select the tone:', { reply_markup: kb });
      } else {
        const idx = session.platforms.indexOf(plat);
        if (idx >= 0) session.platforms.splice(idx, 1);
        else session.platforms.push(plat);
        await TelegramSession.set(chatId, session);
        
        const isSel = (p: string) => session.platforms.includes(p) ? '✅' : '❌';
        const kb = new InlineKeyboard()
          .text(`Twitter ${isSel('TWITTER')}`, 'plat:TWITTER').text(`LinkedIn ${isSel('LINKEDIN')}`, 'plat:LINKEDIN').row()
          .text(`Instagram ${isSel('INSTAGRAM')}`, 'plat:INSTAGRAM').text(`Threads ${isSel('THREADS')}`, 'plat:THREADS').row()
          .text(`🧪 Test ${isSel('TEST')}`, 'plat:TEST').row()
          .text('Next ➡️', 'plat:NEXT');
        await ctx.editMessageReplyMarkup({ reply_markup: kb });
      }
    } else if (data.startsWith('tone:')) {
      session.tone = data.split(':')[1];
      session.step = 'MODEL';
      await TelegramSession.set(chatId, session);
      const kb = new InlineKeyboard()
        .text('Groq (Llama 3)', 'model:groq');
      await ctx.editMessageText('AI Engine:', { reply_markup: kb });
    } else if (data.startsWith('model:')) {
      session.model = data.split(':')[1];
      session.step = 'IDEA';
      await TelegramSession.set(chatId, session);
      await ctx.editMessageText('Great! Now type in your idea (max 500 chars):');
    } else if (data.startsWith('level:')) {
      session.level = data.split(':')[1];
      session.step = 'GENERATING_START';
      await TelegramSession.set(chatId, session);
      await ctx.editMessageText('Perfect! Starting generation...');
      
      // Trigger the actual generation logic
      await handleGeneration(ctx, chatId, session);
    }

    await ctx.answerCallbackQuery();
  });

  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const session = await TelegramSession.get(chatId);

    if (ctx.message.text.startsWith('/')) {
      return;
    }

    if (!session || session.step !== 'IDEA') {
      return ctx.reply('Please use the buttons to continue or type /start to restart.');
    }

    const idea = ctx.message.text;
    if (idea.length > 500) {
      return ctx.reply(`Your idea is ${idea.length} characters long. Please shorten it to under 500 chars.`);
    }

    session.idea = idea;
    session.step = 'LEVEL';
    await TelegramSession.set(chatId, session);

    const kb = new InlineKeyboard()
      .text('Minimal (Short)', 'level:MINIMAL')
      .text('Medium (Balanced)', 'level:MEDIUM').row()
      .text('High (Detailed)', 'level:HIGH');

    await ctx.reply('How detailed should the AI be?', { reply_markup: kb });
  });

  const handleGeneration = async (ctx: any, chatId: number, session: any) => {
    const msg = await ctx.reply('Generating content...');

    try {
      const firstUser = await prisma.user.findFirst();
      const user = firstUser || await prisma.user.create({
        data: {
          email: `telegram_${chatId}@postly.local`,
          password_hash: 'telegram-user',
          name: ctx.from?.first_name || 'Telegram User',
        }
      });

      console.log(`[Telegram] Starting generation for user ${user.id}, platforms: ${session.platforms}`);
      const results = await AiEngineService.generateForPlatforms(
        user.id,
        session.platforms,
        session.idea,
        session.tone,
        session.postType,
        session.model,
        session.level
      );
      console.log(`[Telegram] Generation completed for ${results.length} platforms`);

      // Auto-publish: push generated posts into BullMQ queue
      const { PostsService } = await import('../posts/posts.service');
      const latestPost = await prisma.post.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      });
      if (latestPost) {
        await PostsService.publish(user.id, latestPost.id);
      }

      let responseText = 'Here is your generated content:\n\n';
      for (const res of results) {
        if (res.error) {
          responseText += `❌ ${res.platform}: ${res.error}\n\n`;
        } else {
          responseText += `✅ ${res.platform}:\n${res.content}\n\n`;
        }
      }
      responseText += '📤 Posts have been queued for publishing!';

      await ctx.api.editMessageText(chatId, msg.message_id, responseText);
      await TelegramSession.clear(chatId);
    } catch (error) {
      await ctx.api.editMessageText(chatId, msg.message_id, 'Content generation failed. Please try again.');
      await TelegramSession.clear(chatId);
    }
  };

  bot.command('status', async (ctx) => {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return ctx.reply('No user linked.');
    const posts = await prisma.post.findMany({
      where: { user_id: firstUser.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { platform_posts: true }
    });

    if (!posts.length) return ctx.reply('No recent posts found.');
    let msg = 'Your last 5 posts:\n\n';
    posts.forEach(p => {
      msg += `Idea: ${p.idea.substring(0, 30)}...\nStatus: ${p.status}\nPlatforms: ${p.platform_posts.map(pp => `${pp.platform}(${pp.status})`).join(', ')}\n\n`;
    });
    ctx.reply(msg);
  });

  bot.command('accounts', async (ctx) => {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return ctx.reply('No user linked.');
    const socials = await prisma.socialAccount.findMany({
      where: { user_id: firstUser.id }
    });

    if (!socials.length) return ctx.reply('No social accounts connected. Connect them via the dashboard.');
    let msg = 'Your connected accounts:\n\n';
    socials.forEach(s => {
      msg += `✅ ${s.platform}: @${s.handle || 'connected'}\n`;
    });
    ctx.reply(msg);
  });

  bot.command('help', async (ctx) => {
    const helpMsg = `
🚀 *Postly AI Bot Help*

Available commands:
/start - Start creating a new post
/status - Check status of recent posts
/accounts - View connected social accounts
/help - Show this help message

*How to create a post:*
1. Type /start
2. Follow the buttons to select type, platforms, tone, and model.
3. Type your idea (max 500 characters).
4. Choose the detail level.
5. Preview and confirm!
    `;
    ctx.reply(helpMsg, { parse_mode: 'Markdown' });
  });
}
