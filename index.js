// ╔══════════════════════════════════════════════════════════╗
// ║         بوت التذاكر - TruF Store                        ║
// ║         Made with ❤️ by ABO7RB                          ║
// ╚══════════════════════════════════════════════════════════╝

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField,
} = require('discord.js');
require('dotenv').config();
const fs         = require('fs');
const config     = require('./config');
const categories = require('./categories');

// ─── إنشاء العميل ───────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── تتبع التذاكر المفتوحة { userId: channelId } ─────────────
const openTickets = new Map();
const TICKETS_FILE = './tickets.json';

// ─── عداد التذاكر لكل قسم { categoryId: 'nitro' => count } ──
const COUNTERS_FILE = './counters.json';
const categoryCounters = new Map();

function loadCounters() {
  try {
    if (fs.existsSync(COUNTERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTERS_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) categoryCounters.set(k, v);
    }
  } catch (e) { console.error('خطأ في تحميل العدادات:', e); }
}

function saveCounters() {
  fs.writeFileSync(COUNTERS_FILE, JSON.stringify(Object.fromEntries(categoryCounters), null, 2));
}

function getNextCounter(categoryId) {
  const current = categoryCounters.get(categoryId) || 0;
  const next = current + 1;
  categoryCounters.set(categoryId, next);
  saveCounters();
  return next;
}

function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) openTickets.set(k, v);
      console.log(`📂 تم تحميل ${openTickets.size} تذكرة محفوظة`);
    }
  } catch (e) { console.error('خطأ في تحميل التذاكر:', e); }
  loadCounters();
}

function saveTickets() {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(Object.fromEntries(openTickets), null, 2));
}

// ─── قائمة الأوامر (Slash Commands) ────────────────────────
const slashCommands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('📌 إرسال لوحة التذاكر في هذه القناة')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('edit-panel')
    .setDescription('✏️ تعديل إمبد لوحة التذاكر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName('message-id').setDescription('ID الرسالة التي تريد تعديلها').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('عنوان الإمبد الجديد').setRequired(false))
    .addStringOption(o => o.setName('description').setDescription('وصف الإمبد الجديد').setRequired(false))
    .addStringOption(o => o.setName('color').setDescription('لون الإمبد مثال: #ff0000').setRequired(false))
    .addStringOption(o => o.setName('image').setDescription('رابط الصورة الكبيرة').setRequired(false))
    .addStringOption(o => o.setName('thumbnail').setDescription('رابط اللوقو').setRequired(false)),

  new SlashCommandBuilder()
    .setName('close')
    .setDescription('🔒 إغلاق التذكرة الحالية'),

  new SlashCommandBuilder()
    .setName('add')
    .setDescription('➕ إضافة عضو إلى التذكرة')
    .addUserOption(o => o.setName('member').setDescription('العضو الذي تريد إضافته').setRequired(true)),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('➖ إزالة عضو من التذكرة')
    .addUserOption(o => o.setName('member').setDescription('العضو الذي تريد إزالته').setRequired(true)),

  new SlashCommandBuilder()
    .setName('rename')
    .setDescription('✏️ تغيير اسم التذكرة')
    .addStringOption(o => o.setName('name').setDescription('الاسم الجديد').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ticket-info')
    .setDescription('📋 عرض معلومات التذكرة الحالية'),
].map(cmd => cmd.toJSON());

// ─── تسجيل الأوامر ──────────────────────────────────────────
async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: slashCommands }
    );
    console.log('✅ تم تسجيل الأوامر بنجاح!');
  } catch (err) {
    console.error('❌ خطأ في تسجيل الأوامر:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// بناء الإمبدات والأزرار
// ─────────────────────────────────────────────────────────────

function buildPanelEmbed(overrides = {}) {
  const p = config.panel;
  const embed = new EmbedBuilder()
    .setTitle(overrides.title || p.title)
    .setDescription(overrides.description || p.description)
    .setColor(overrides.color || p.color)
    .setFooter({ text: p.footer })
    .setTimestamp();

  const img  = overrides.image     || p.image;
  const thumb = overrides.thumbnail || p.thumbnail;
  if (img && img !== 'YOUR_BANNER_IMAGE_URL')   embed.setImage(img);
  if (thumb && thumb !== 'YOUR_LOGO_IMAGE_URL') embed.setThumbnail(thumb);

  return embed;
}

function buildPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_purchase')
        .setLabel('🛒 طلب شراء')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_inquiry')
        .setLabel('❓ استفسار')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildTicketWelcomeEmbed(type, user) {
  const isPurchase = type === 'purchase';
  return new EmbedBuilder()
    .setTitle(isPurchase ? '🛒 تذكرة شراء جديدة' : '❓ تذكرة استفسار جديدة')
    .setDescription(
      config.ticket.welcomeMessage
        .replace('{user}', `<@${user.id}>`)
        .replace('{type}', isPurchase ? '🛒 شراء' : '❓ استفسار')
    )
    .setColor(isPurchase ? config.ticket.purchaseColor : config.ticket.inquiryColor)
    .addFields(
      { name: '👤 العضو',   value: `<@${user.id}> \`${user.tag}\``,             inline: true },
      { name: '📋 النوع',   value: isPurchase ? '🛒 شراء' : '❓ استفسار',       inline: true },
      { name: '📅 الوقت',   value: `<t:${Math.floor(Date.now() / 1000)}:R>`,    inline: true }
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: config.panel.footer })
    .setTimestamp();
}

function buildOpenTicketButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('🔒 إغلاق التذكرة')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_admin_panel')
        .setLabel('⚙️ الإدارة')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

// ─── بناء أزرار أقسام الإدارة ─────────────────────────────────
function buildAdminCategoryButtons() {
  const rows = [];
  const btns = categories.categories.map(cat =>
    new ButtonBuilder()
      .setCustomId(`cat_move_${cat.id}`)
      .setLabel(cat.label)
      .setEmoji(cat.emoji)
      .setStyle(ButtonStyle.Primary)
  );

  // Discord تسمح بـ 5 أزرار في كل صف
  for (let i = 0; i < btns.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(btns.slice(i, i + 5)));
  }
  return rows;
}

function buildCloseConfirmButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_close')
        .setLabel('✅ نعم، أغلق التذكرة')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_close')
        .setLabel('❌ إلغاء')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildClosedTicketButtons(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_reopen_${userId}`)
        .setLabel('🔓 إعادة فتح التذكرة')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('🗑️ حذف التذكرة')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

// ─────────────────────────────────────────────────────────────
// إنشاء التذكرة
// ─────────────────────────────────────────────────────────────

async function createTicket(interaction, type) {
  const guild = interaction.guild;
  const user  = interaction.user;

  // ─── التحقق: هل لديه تذكرة مفتوحة؟ ─────────────────────
  if (openTickets.has(user.id)) {
    const existingId = openTickets.get(user.id);
    const existing   = guild.channels.cache.get(existingId);
    if (existing) {
      return interaction.reply({
        content: `⚠️ **لديك تذكرة مفتوحة بالفعل!**\n> ${existing.toString()}\nأغلق تذكرتك الحالية أولاً قبل فتح تذكرة جديدة.`,
        ephemeral: true,
      });
    }
    // القناة محذوفة — أزل التتبع
    openTickets.delete(user.id);
    saveTickets();
  }

  await interaction.deferReply({ ephemeral: true });

  // ─── إنشاء قناة التذكرة ───────────────────────────────────
  const safeName   = user.username.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
  const channelName = `تكت-${safeName}`;

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  if (config.roles.adminRoleId && config.roles.adminRoleId !== 'ADMIN_ROLE_ID') {
    permissionOverwrites.push({
      id: config.roles.adminRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    });
  }

  if (
    config.roles.supportRoleId &&
    config.roles.supportRoleId !== 'SUPPORT_ROLE_ID' &&
    config.roles.supportRoleId !== config.roles.adminRoleId
  ) {
    permissionOverwrites.push({
      id: config.roles.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.ticket.categoryId !== 'CATEGORY_ID' ? config.ticket.categoryId : null,
    permissionOverwrites,
    topic: `${type === 'purchase' ? '🛒 شراء' : '❓ استفسار'} | ${user.tag} | ${user.id}`,
  });

  // ─── تتبع التذكرة ─────────────────────────────────────────
  openTickets.set(user.id, channel.id);
  saveTickets();

  // ─── إرسال رسالة الترحيب ───────────────────────────────────
  const mentionParts = [`<@${user.id}>`];
  if (config.roles.adminRoleId   !== 'ADMIN_ROLE_ID')   mentionParts.push(`<@&${config.roles.adminRoleId}>`);
  if (config.roles.supportRoleId !== 'SUPPORT_ROLE_ID' &&
      config.roles.supportRoleId !== config.roles.adminRoleId) {
    mentionParts.push(`<@&${config.roles.supportRoleId}>`);
  }

  await channel.send({
    content: mentionParts.join(' '),
    embeds:  [buildTicketWelcomeEmbed(type, user)],
    components: buildOpenTicketButtons(),
  });

  // ─── إشعار اللوق ──────────────────────────────────────────
  await sendLog(guild, new EmbedBuilder()
    .setTitle('📬 تم فتح تذكرة جديدة')
    .setColor('#57F287')
    .addFields(
      { name: '👤 العضو',    value: `<@${user.id}> \`${user.tag}\``,         inline: true },
      { name: '📋 النوع',    value: type === 'purchase' ? '🛒 شراء' : '❓ استفسار', inline: true },
      { name: '📍 القناة',   value: channel.toString(),                       inline: true },
    )
    .setTimestamp()
  );

  // ─── إشعار الأدمن بالخاص (DM) ────────────────────────────
  await sendAdminDM(guild, user, channel, type);

  await interaction.editReply({ content: `✅ **تم إنشاء تذكرتك!**\n> ${channel.toString()}` });
}

// ─────────────────────────────────────────────────────────────
// إرسال اللوق
// ─────────────────────────────────────────────────────────────

async function sendLog(guild, embed) {
  if (!config.channels.logChannelId || config.channels.logChannelId === 'LOG_CHANNEL_ID') return;
  try {
    const logChannel = guild.channels.cache.get(config.channels.logChannelId);
    if (logChannel) await logChannel.send({ embeds: [embed] });
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// إرسال DM للأدمن والدعم عند فتح تذكرة جديدة
// ─────────────────────────────────────────────────────────────

async function sendAdminDM(guild, ticketUser, channel, type) {
  const isPurchase = type === 'purchase';

  const dmEmbed = new EmbedBuilder()
    .setTitle('🔔 تنبيه — تم فتح تذكرة جديدة!')
    .setDescription(
      `قام العضو <@${ticketUser.id}> بفتح تذكرة جديدة وينتظر الرد.\n\n` +
      `📍 **التذكرة:** ${channel.toString()}`
    )
    .setColor(isPurchase ? config.ticket.purchaseColor : config.ticket.inquiryColor)
    .addFields(
      { name: '👤 العضو',   value: `${ticketUser.tag} \`${ticketUser.id}\``, inline: true },
      { name: '📋 النوع',   value: isPurchase ? '🛒 شراء' : '❓ استفسار',    inline: true },
      { name: '📅 الوقت',   value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    )
    .setThumbnail(ticketUser.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: config.panel.footer })
    .setTimestamp();

  // جمع الأدوار اللي نبغى نرسل لها
  const roleIds = new Set();
  if (config.roles.adminRoleId   && config.roles.adminRoleId   !== 'ADMIN_ROLE_ID')   roleIds.add(config.roles.adminRoleId);
  if (config.roles.supportRoleId && config.roles.supportRoleId !== 'SUPPORT_ROLE_ID') roleIds.add(config.roles.supportRoleId);

  if (roleIds.size === 0) return;

  // جلب أعضاء السيرفر (مهم عشان نتحقق من الرولات)
  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  const notified = new Set(); // ما نرسل لنفس الشخص مرتين

  for (const roleId of roleIds) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;

    for (const [memberId, member] of role.members) {
      // ما نرسل للعضو اللي فتح التذكرة ولا نكرر
      if (memberId === ticketUser.id) continue;
      if (notified.has(memberId)) continue;

      try {
        await member.send({ embeds: [dmEmbed] });
        notified.add(memberId);
      } catch {
        // العضو أغلق DMs — نتجاهل الخطأ
      }
    }
  }

  console.log(`📨 تم إرسال DM لـ ${notified.size} مسؤول`);
}

// ─────────────────────────────────────────────────────────────
// مساعد: هل هذه قناة تذكرة؟
// ─────────────────────────────────────────────────────────────

function getTicketOwner(channelId) {
  for (const [uid, cid] of openTickets.entries()) {
    if (cid === channelId) return uid;
  }
  return null;
}

function isAdmin(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (config.roles.adminRoleId !== 'ADMIN_ROLE_ID' && member.roles.cache.has(config.roles.adminRoleId)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
//  Ready
// ─────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`\n✅ البوت شغال: ${client.user.tag}`);
  console.log(`📡 في ${client.guilds.cache.size} سيرفر`);
  loadTickets();
  await deployCommands();
  client.user.setActivity('🎫 نظام التذاكر | Rokkr Store', { type: 3 }); // Watching
});

// ─────────────────────────────────────────────────────────────
//  InteractionCreate — المعالج الرئيسي
// ─────────────────────────────────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  try {

    // ═══════════════════════════════════════════
    //  Slash Commands
    // ═══════════════════════════════════════════
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.commandName;

      // ── /setup ──────────────────────────────
      if (cmd === 'setup') {
        await interaction.channel.send({
          embeds:     [buildPanelEmbed()],
          components: buildPanelButtons(),
        });
        return interaction.reply({ content: '✅ تم إرسال لوحة التذاكر!', ephemeral: true });
      }

      // ── /edit-panel ─────────────────────────
      if (cmd === 'edit-panel') {
        const msgId = interaction.options.getString('message-id');
        let msg;
        try {
          msg = await interaction.channel.messages.fetch(msgId);
        } catch {
          return interaction.reply({ content: '❌ لم أجد الرسالة بهذا الـ ID في هذه القناة.', ephemeral: true });
        }
        if (msg.author.id !== client.user.id) {
          return interaction.reply({ content: '❌ هذه الرسالة ليست مرسلة من البوت.', ephemeral: true });
        }

        const oldEmbed = msg.embeds[0] || {};
        const newEmbed = buildPanelEmbed({
          title:       interaction.options.getString('title')       || oldEmbed.title,
          description: interaction.options.getString('description') || oldEmbed.description,
          color:       interaction.options.getString('color')       || null,
          image:       interaction.options.getString('image')       || oldEmbed.image?.url,
          thumbnail:   interaction.options.getString('thumbnail')   || oldEmbed.thumbnail?.url,
        });

        await msg.edit({ embeds: [newEmbed], components: buildPanelButtons() });
        return interaction.reply({ content: '✅ تم تعديل الإمبد بنجاح!', ephemeral: true });
      }

      // ── /close ──────────────────────────────
      if (cmd === 'close') {
        const channel = interaction.channel;
        const ownerUID = getTicketOwner(channel.id);
        if (!ownerUID) {
          return interaction.reply({ content: '❌ هذه ليست قناة تذكرة مفتوحة.', ephemeral: true });
        }

        const confirmEmbed = new EmbedBuilder()
          .setTitle('⚠️ تأكيد إغلاق التذكرة')
          .setDescription('هل أنت متأكد من إغلاق هذه التذكرة؟')
          .setColor('#FEE75C');

        return interaction.reply({
          embeds:     [confirmEmbed],
          components: buildCloseConfirmButtons(),
        });
      }

      // ── /add ────────────────────────────────
      if (cmd === 'add') {
        const channel = interaction.channel;
        if (!getTicketOwner(channel.id)) {
          return interaction.reply({ content: '❌ هذه ليست قناة تذكرة.', ephemeral: true });
        }
        const target = interaction.options.getUser('member');
        await channel.permissionOverwrites.edit(target.id, {
          ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
        });
        return interaction.reply({ content: `✅ تم إضافة <@${target.id}> إلى التذكرة.` });
      }

      // ── /remove ─────────────────────────────
      if (cmd === 'remove') {
        const channel = interaction.channel;
        if (!getTicketOwner(channel.id)) {
          return interaction.reply({ content: '❌ هذه ليست قناة تذكرة.', ephemeral: true });
        }
        const target = interaction.options.getUser('member');
        await channel.permissionOverwrites.edit(target.id, { ViewChannel: false });
        return interaction.reply({ content: `✅ تم إزالة <@${target.id}> من التذكرة.` });
      }

      // ── /rename ─────────────────────────────
      if (cmd === 'rename') {
        const channel = interaction.channel;
        if (!getTicketOwner(channel.id)) {
          return interaction.reply({ content: '❌ هذه ليست قناة تذكرة.', ephemeral: true });
        }
        const newName = interaction.options.getString('name');
        await channel.setName(`تكت-${newName}`);
        return interaction.reply({ content: `✅ تم تغيير اسم التذكرة إلى **تكت-${newName}**.` });
      }

      // ── /ticket-info ────────────────────────
      if (cmd === 'ticket-info') {
        const channel = interaction.channel;
        const ownerUID = getTicketOwner(channel.id);
        if (!ownerUID) {
          return interaction.reply({ content: '❌ هذه ليست قناة تذكرة.', ephemeral: true });
        }
        const topic = channel.topic || '';
        const infoEmbed = new EmbedBuilder()
          .setTitle('📋 معلومات التذكرة')
          .setColor('#5865F2')
          .addFields(
            { name: '👤 صاحب التذكرة', value: `<@${ownerUID}>`,            inline: true },
            { name: '📍 القناة',        value: channel.toString(),           inline: true },
            { name: '📝 الموضوع',       value: topic || 'لا يوجد',          inline: false },
          )
          .setTimestamp();
        return interaction.reply({ embeds: [infoEmbed], ephemeral: true });
      }
    }

    // ═══════════════════════════════════════════
    //  Button Interactions
    // ═══════════════════════════════════════════
    if (interaction.isButton()) {
      const id = interaction.customId;

      // ── فتح تذكرة شراء ─────────────────────
      if (id === 'ticket_purchase') return createTicket(interaction, 'purchase');

      // ── فتح تذكرة استفسار ──────────────────
      if (id === 'ticket_inquiry') return createTicket(interaction, 'inquiry');

      // ── زر الإدارة داخل التذكرة ────────────
      if (id === 'ticket_admin_panel') {
        // التحقق من الصلاحية
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = categories.allowedRoles.some(r => member.roles.cache.has(r));
        const isAdminUser = member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasRole && !isAdminUser) {
          return interaction.reply({
            content: '❌ **ليس لديك صلاحية** للوصول إلى لوحة الإدارة.',
            ephemeral: true,
          });
        }

        const ownerUID = getTicketOwner(interaction.channel.id);
        const adminEmbed = new EmbedBuilder()
          .setTitle('⚙️ لوحة الإدارة')
          .setDescription(
            ownerUID
              ? `**ماهو طلب العضو <@${ownerUID}>؟**\nاختر القسم المناسب لتحويل التذكرة إليه.`
              : '**اختر القسم المناسب لتحويل التذكرة إليه.**'
          )
          .setColor('#5865F2')
          .setFooter({ text: config.panel.footer })
          .setTimestamp();

        return interaction.reply({
          embeds: [adminEmbed],
          components: buildAdminCategoryButtons(),
          ephemeral: true,
        });
      }

      // ── زر الانتقال لقسم محدد ──────────────
      if (id.startsWith('cat_move_')) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = categories.allowedRoles.some(r => member.roles.cache.has(r));
        const isAdminUser = member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasRole && !isAdminUser) {
          return interaction.reply({ content: '❌ ليس لديك صلاحية.', ephemeral: true });
        }

        const catId  = id.replace('cat_move_', '');
        const catCfg = categories.categories.find(c => c.id === catId);
        if (!catCfg) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel;
        const guild   = interaction.guild;

        // الترقيم التسلسلي
        const num      = getNextCounter(catId);
        const newName  = `${catCfg.channelPrefix}-${num}`;

        // نقل الكاتيقوري وتغيير الاسم
        const validCategoryId = catCfg.categoryId &&
          !catCfg.categoryId.includes('CATEGORY_ID') &&
          catCfg.categoryId !== '';

        if (validCategoryId) {
          try {
            // نجيب صلاحيات الروم الحالية قبل النقل عشان نحافظ عليها
            const existingOverwrites = channel.permissionOverwrites.cache.map(ow => ({
              id: ow.id,
              allow: ow.allow,
              deny: ow.deny,
              type: ow.type,
            }));

            await channel.setParent(catCfg.categoryId, {
              lockPermissions: true,  // نورث الكاتيقوري
            });

            // نعيد تطبيق الصلاحيات القديمة فوق صلاحيات الكاتيقوري
            for (const ow of existingOverwrites) {
              await channel.permissionOverwrites.edit(ow.id, {
                ViewChannel:        ow.allow.has('ViewChannel')        ? true  : ow.deny.has('ViewChannel')        ? false : null,
                SendMessages:       ow.allow.has('SendMessages')       ? true  : ow.deny.has('SendMessages')       ? false : null,
                ReadMessageHistory: ow.allow.has('ReadMessageHistory') ? true  : ow.deny.has('ReadMessageHistory') ? false : null,
                ManageChannels:     ow.allow.has('ManageChannels')     ? true  : ow.deny.has('ManageChannels')     ? false : null,
                AttachFiles:        ow.allow.has('AttachFiles')        ? true  : ow.deny.has('AttachFiles')        ? false : null,
                EmbedLinks:         ow.allow.has('EmbedLinks')         ? true  : ow.deny.has('EmbedLinks')         ? false : null,
              }).catch(() => {});
            }
          } catch (err) {
            console.error('خطأ في نقل الكاتيقوري:', err.message);
          }
        }
        await channel.setName(newName).catch(() => {});

        // رسالة الانتقال داخل التذكرة
        const moveEmbed = new EmbedBuilder()
          .setTitle('📂 تم تحويل التذكرة')
          .setDescription(
            `${catCfg.description}\n\n` +
            `> تم التحويل بواسطة <@${interaction.user.id}>`
          )
          .setColor(catCfg.color)
          .setTimestamp();

        await channel.send({ embeds: [moveEmbed] });

        // لوق
        const ownerUID = getTicketOwner(channel.id);
        await sendLog(guild, new EmbedBuilder()
          .setTitle('📂 تم تحويل تذكرة')
          .setColor(catCfg.color)
          .addFields(
            { name: '👤 العضو',   value: ownerUID ? `<@${ownerUID}>` : 'غير معروف', inline: true },
            { name: '📁 القسم',   value: `${catCfg.emoji} ${catCfg.label}`,          inline: true },
            { name: '📍 القناة',  value: channel.toString(),                          inline: true },
            { name: '🔧 بواسطة', value: `<@${interaction.user.id}>`,                 inline: true },
          )
          .setTimestamp()
        );

        return interaction.editReply({ content: `✅ تم تحويل التذكرة إلى قسم **${catCfg.label}** وتسميتها **${newName}**` });
      }

      // ── زر الإغلاق داخل التذكرة ────────────
      if (id === 'ticket_close') {
        const confirmEmbed = new EmbedBuilder()
          .setTitle('⚠️ تأكيد إغلاق التذكرة')
          .setDescription('هل أنت متأكد من إغلاق هذه التذكرة؟\nسيتم إخفاء القناة عنك ولن تتمكن من رؤيتها.')
          .setColor('#FEE75C');

        return interaction.reply({
          embeds:     [confirmEmbed],
          components: buildCloseConfirmButtons(),
        });
      }

      // ── تأكيد الإغلاق ──────────────────────
      if (id === 'confirm_close') {
        await interaction.deferReply({ ephemeral: true });
        const channel  = interaction.channel;
        let ownerUID = getTicketOwner(channel.id);

        // fallback: اقرأ الـ ownerUID من topic القناة
        if (!ownerUID && channel.topic) {
          const topicMatch = channel.topic.match(/\|\s*(\d{17,20})\s*$/);
          if (topicMatch) ownerUID = topicMatch[1];
        }

        // إزالة صلاحية العضو
        if (ownerUID) {
          try {
            await channel.permissionOverwrites.edit(ownerUID, { ViewChannel: false });
          } catch {}
          openTickets.delete(ownerUID);
          saveTickets();
        }

        // تغيير اسم القناة — أضف 🔒 في البداية فقط إذا ما كانت موجودة
        const currentName = channel.name;
        const lockedName  = currentName.startsWith('🔒-') ? currentName : `🔒-${currentName}`;
        await channel.setName(lockedName).catch(() => {});

        // رسالة الإغلاق مع أزرار الأدمن
        const closedEmbed = new EmbedBuilder()
          .setTitle('🔒 تم إغلاق التذكرة')
          .setDescription(
            `تم الإغلاق بواسطة <@${interaction.user.id}>\n` +
            `> فقط الإدارة يمكنها إعادة الفتح أو الحذف.`
          )
          .setColor('#ED4245')
          .setTimestamp();

        await channel.send({
          embeds:     [closedEmbed],
          components: buildClosedTicketButtons(ownerUID || 'unknown'),
        });

        // لوق
        await sendLog(interaction.guild, new EmbedBuilder()
          .setTitle('🔒 تم إغلاق تذكرة')
          .setColor('#ED4245')
          .addFields(
            { name: '👤 العضو',   value: ownerUID ? `<@${ownerUID}>` : 'غير معروف',     inline: true },
            { name: '🔧 المغلق',  value: `<@${interaction.user.id}>`,                    inline: true },
            { name: '📍 القناة',  value: channel.toString(),                             inline: true },
          )
          .setTimestamp()
        );

        return interaction.editReply({ content: '✅ تم إغلاق التذكرة.' });
      }

      // ── إلغاء الإغلاق ──────────────────────
      if (id === 'cancel_close') {
        return interaction.reply({ content: '❌ تم إلغاء عملية الإغلاق.', ephemeral: true });
      }

      // ── إعادة فتح التذكرة ─────────────────
      if (id.startsWith('ticket_reopen_')) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isAdmin(member)) {
          return interaction.reply({ content: '❌ فقط الإدارة يمكنها إعادة فتح التذاكر.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const ownerUID = id.replace('ticket_reopen_', '');
        const channel  = interaction.channel;

        // إعادة الصلاحيات
        try {
          await channel.permissionOverwrites.edit(ownerUID, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
          });
        } catch {}

        // تتبع من جديد
        openTickets.set(ownerUID, channel.id);
        saveTickets();

        // إعادة تسمية القناة — شيل 🔒 بس إذا كانت موجودة
        const reopenName = channel.name.startsWith('🔒-') ? channel.name.slice(3) : channel.name;
        await channel.setName(reopenName).catch(() => {});

        // رسالة الإعادة
        const reopenEmbed = new EmbedBuilder()
          .setTitle('🔓 تم إعادة فتح التذكرة')
          .setDescription(`تمت الإعادة بواسطة <@${interaction.user.id}>`)
          .setColor('#57F287')
          .setTimestamp();

        await channel.send({
          content:    `<@${ownerUID}> ✅ **تم إعادة فتح تذكرتك!**`,
          embeds:     [reopenEmbed],
          components: buildOpenTicketButtons(),
        });

        // لوق
        await sendLog(interaction.guild, new EmbedBuilder()
          .setTitle('🔓 تم إعادة فتح تذكرة')
          .setColor('#57F287')
          .addFields(
            { name: '👤 العضو',    value: `<@${ownerUID}>`,              inline: true },
            { name: '🔧 فتحها',   value: `<@${interaction.user.id}>`,   inline: true },
            { name: '📍 القناة',  value: channel.toString(),             inline: true },
          )
          .setTimestamp()
        );

        return interaction.editReply({ content: '✅ تم إعادة فتح التذكرة.' });
      }

      // ── حذف التذكرة نهائياً ───────────────
      if (id === 'ticket_delete') {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isAdmin(member)) {
          return interaction.reply({ content: '❌ فقط الإدارة يمكنها حذف التذاكر.', ephemeral: true });
        }

        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirm_delete')
            .setLabel('🗑️ نعم، احذف نهائياً')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('cancel_close')
            .setLabel('❌ إلغاء')
            .setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({
          content:    '⚠️ **هل أنت متأكد من حذف هذه التذكرة نهائياً؟**\nلا يمكن التراجع عن هذه العملية!',
          components: [confirmRow],
          ephemeral:  true,
        });
      }

      // ── تأكيد الحذف النهائي ───────────────
      if (id === 'confirm_delete') {
        await sendLog(interaction.guild, new EmbedBuilder()
          .setTitle('🗑️ تم حذف تذكرة')
          .setColor('#ED4245')
          .addFields(
            { name: '📍 القناة',  value: interaction.channel.name,        inline: true },
            { name: '🔧 الحاذف', value: `<@${interaction.user.id}>`,      inline: true },
          )
          .setTimestamp()
        );

        await interaction.reply({ content: '🗑️ جاري الحذف...', ephemeral: true });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
      }
    }

  } catch (err) {
    console.error('❌ خطأ في معالج التفاعل:', err);
    const msg = { content: '❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
      else await interaction.reply(msg);
    } catch {}
  }
});

// ─────────────────────────────────────────────────────────────
//  تشغيل البوت
// ─────────────────────────────────────────────────────────────
client.login(process.env.TOKEN).catch(err => {
  console.error('❌ فشل تسجيل الدخول - تحقق من التوكن في config.js');
  console.error(err.message);
  process.exit(1);
});
