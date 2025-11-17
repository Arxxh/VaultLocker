/*
  Warnings:

  - Added the required column `masterPinHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recoveryCodeHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "masterPinHash" TEXT NOT NULL,
ADD COLUMN     "recoveryCodeHash" TEXT NOT NULL;
