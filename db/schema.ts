import {sqliteTable,text,integer,real,uniqueIndex,index,check} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const firstHour=sqliteTable('first_hour',{
 ownerId:text('owner_id').primaryKey(),state:text('state').notNull().default('{}'),revision:integer('revision').notNull().default(0),inviteToken:text('invite_token'),updatedAt:integer('updated_at').notNull()
},t=>[uniqueIndex('idx_first_hour_invite').on(t.inviteToken)]);
export const profiles=sqliteTable('profiles',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),friendCode:text('friend_code').notNull(),name:text('name').notNull(),avatar:text('avatar').notNull(),status:text('status').notNull(),note:text('note').notNull(),homeId:text('home_id').notNull(),lastSeen:integer('last_seen').notNull()
},t=>[uniqueIndex('idx_profiles_owner').on(t.ownerId),uniqueIndex('idx_profiles_friend_code').on(t.friendCode)]);
export const friendships=sqliteTable('friendships',{
 id:text('id').primaryKey(),pairKey:text('pair_key').notNull(),fromId:text('from_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),toId:text('to_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),status:text('status').notNull(),createdAt:integer('created_at').notNull()
},t=>[uniqueIndex('idx_friendships_pair').on(t.pairKey),index('idx_friendships_from').on(t.fromId),index('idx_friendships_to').on(t.toId),check('friendship_status',sql`${t.status} in ('pending','accepted')`),check('friendship_distinct_players',sql`${t.fromId} <> ${t.toId}`)]);
export const residences=sqliteTable('residences',{
 profileId:text('profile_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),homeId:text('home_id').notNull(),unit:integer('unit').notNull(),level:integer('level').notNull().default(0),credits:integer('credits').notNull().default(120),deliveries:integer('deliveries').notNull().default(0),jobId:text('job_id'),jobStage:integer('job_stage').notNull().default(0),jobStartedAt:integer('job_started_at').notNull().default(0),updatedAt:integer('updated_at').notNull()
},t=>[uniqueIndex('idx_residences_address').on(t.homeId,t.unit),check('residence_level',sql`${t.level} between 0 and 3`),check('residence_credits',sql`${t.credits} >= 0`)]);
export const worldRooms=sqliteTable('world_rooms',{
 id:integer('id').primaryKey({autoIncrement:true}),createdAt:integer('created_at').notNull()
});
export const worldMembers=sqliteTable('world_members',{
 profileId:text('profile_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),roomId:integer('room_id').notNull().references(()=>worldRooms.id),session:text('session').notNull(),seq:integer('seq').notNull().default(0),x:real('x').notNull(),z:real('z').notNull(),heading:real('heading').notNull().default(0),mode:text('mode').notNull(),carId:text('car_id').notNull(),lastSeen:integer('last_seen').notNull()
},t=>[index('idx_world_members_room_seen').on(t.roomId,t.lastSeen),check('world_member_mode',sql`${t.mode} in ('apartment','garage','driving','destination')`)]);
export const neighborhoodAccounts=sqliteTable('neighborhood_accounts',{
 profileId:text('profile_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),data:text('data').notNull(),revision:integer('revision').notNull().default(0),operation:text('operation').notNull().default(''),updatedAt:integer('updated_at').notNull()
});
export const neighborhoodPresence=sqliteTable('neighborhood_presence',{
 profileId:text('profile_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),venue:text('venue').notNull().default(''),travel:text('travel').notNull().default('car'),hostId:text('host_id'),localX:real('local_x').notNull().default(0),localZ:real('local_z').notNull().default(0),emote:text('emote').notNull().default(''),emoteAt:integer('emote_at').notNull().default(0)
});
export const neighborhoodContracts=sqliteTable('neighborhood_contracts',{
 id:text('id').primaryKey(),roomId:integer('room_id').notNull().references(()=>worldRooms.id),hostId:text('host_id').notNull().references(()=>profiles.id),jobId:text('job_id').notNull(),members:text('members').notNull(),stage:integer('stage').notNull().default(-1),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull(),stageAt:integer('stage_at').notNull(),status:text('status').notNull().default('forming')
},t=>[index('idx_contracts_room').on(t.roomId,t.createdAt)]);
export const neighborhoodMessages=sqliteTable('neighborhood_messages',{
 id:integer('id').primaryKey({autoIncrement:true}),profileId:text('profile_id').notNull().references(()=>profiles.id),roomId:integer('room_id').notNull().references(()=>worldRooms.id),scope:text('scope').notNull(),text:text('text').notNull(),createdAt:integer('created_at').notNull()
},t=>[index('idx_messages_room').on(t.roomId,t.createdAt)]);
export const neighborhoodMutes=sqliteTable('neighborhood_mutes',{
 ownerId:text('owner_id').notNull().references(()=>profiles.id),targetId:text('target_id').notNull().references(()=>profiles.id)
},t=>[uniqueIndex('idx_mutes_pair').on(t.ownerId,t.targetId)]);
export const neighborhoodReports=sqliteTable('neighborhood_reports',{
 id:integer('id').primaryKey({autoIncrement:true}),ownerId:text('owner_id').notNull().references(()=>profiles.id),messageId:integer('message_id').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull()
},t=>[uniqueIndex('idx_reports_pair').on(t.ownerId,t.messageId)]);
export const testnetAccounts=sqliteTable('testnet_accounts',{
 ownerId:text('owner_id').primaryKey(),registry:text('registry').notNull().default(''),token:text('token').notNull().default(''),wallet:text('wallet'),nonce:text('nonce'),expiresAt:integer('expires_at').notNull().default(0),updatedAt:integer('updated_at').notNull()
});

export const clubAccounts=sqliteTable('club_accounts',{
 profileId:text('profile_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),chips:integer('chips').notNull().default(500),giftDay:text('gift_day').notNull()
},t=>[check('club_chips_nonnegative',sql`${t.chips} >= 0`)]);
export const clubTables=sqliteTable('club_tables',{
 id:text('id').primaryKey(),roomId:integer('room_id').notNull().references(()=>worldRooms.id),data:text('data').notNull(),revision:integer('revision').notNull().default(0),operation:text('operation').notNull().default(''),updatedAt:integer('updated_at').notNull()
});
