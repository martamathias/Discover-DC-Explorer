import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const dishPhotos = pgTable('dish_photos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  caption: text('caption').notNull(),
  mimeType: text('mime_type').notNull(),
  imageBase64: text('image_base64').notNull(),
  inspectorNote: text('inspector_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
