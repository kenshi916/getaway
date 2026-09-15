import {sqliteTable,text,integer,uniqueIndex,index,check} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const profiles=sqliteTable('profiles',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),friendCode:text('friend_code').notNull(),name:text('name').notNull(),avatar:text('avatar').notNull(),status:text('status').notNull(),note:text('note').notNull(),homeId:text('home_id').notNull(),lastSeen:integer('last_seen').notNull()
},t=>[uniqueIndex('idx_profiles_owner').on(t.ownerId),uniqueIndex('idx_profiles_friend_code').on(t.friendCode)]);
export const friendships=sqliteTable('friendships',{
 id:text('id').primaryKey(),pairKey:text('pair_key').notNull(),fromId:text('from_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),toId:text('to_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),status:text('status').notNull(),createdAt:integer('created_at').notNull()
},t=>[uniqueIndex('idx_friendships_pair').on(t.pairKey),index('idx_friendships_from').on(t.fromId),index('idx_friendships_to').on(t.toId),check('friendship_status',sql`${t.status} in ('pending','accepted')`),check('friendship_distinct_players',sql`${t.fromId} <> ${t.toId}`)]);
