-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "whatsapp" TEXT,
    "provincia" TEXT,
    "canton" TEXT,
    "avatar_url" TEXT,
    "groups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cromos" (
    "user_id" UUID NOT NULL,
    "have" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doubles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "need" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cromos_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "admin_id" UUID NOT NULL,
    "members" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "last_message" TEXT NOT NULL DEFAULT '',
    "last_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_blocked_idx" ON "profiles"("blocked");

-- CreateIndex
CREATE INDEX "profiles_is_admin_idx" ON "profiles"("is_admin");

-- CreateIndex
CREATE INDEX "profiles_provincia_canton_idx" ON "profiles"("provincia", "canton");

-- CreateIndex
CREATE UNIQUE INDEX "groups_code_key" ON "groups"("code");

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- CreateIndex
CREATE INDEX "groups_admin_id_idx" ON "groups"("admin_id");

-- CreateIndex
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "conversations_user1_id_idx" ON "conversations"("user1_id");

-- CreateIndex
CREATE INDEX "conversations_user2_id_idx" ON "conversations"("user2_id");

-- CreateIndex
CREATE INDEX "conversations_last_at_idx" ON "conversations"("last_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- AddForeignKey
ALTER TABLE "user_cromos" ADD CONSTRAINT "user_cromos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
