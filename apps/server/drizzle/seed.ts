import { db } from "@/db"
import permissionData from "@/db/important-data/permission.json"
import roleData from "@/db/important-data/role.json"
import rolePermissionData from "@/db/important-data/role_permission.json"
import { account, session, user } from "@/db/schema/auth"
import { classHistory } from "@/db/schema/class_history"
import { classSchedule } from "@/db/schema/class_schedule"
import { course } from "@/db/schema/course"
import { permission, role, rolePermission, userRole } from "@/db/schema/pbac"
import { room } from "@/db/schema/room"
import { section } from "@/db/schema/section"
import { slot } from "@/db/schema/slot"
import { generateWeeklyClassHistory } from "@/lib/cron-function"
import {
  seedClassSchedule,
  seedCourses,
  seedRooms,
  seedSections,
  seedSlots,
  seedUsersAndAccounts,
} from "./seedData"

async function seed() {
  console.log("🌱 Resetting all tables...")
  await db.delete(classSchedule)
  await db.delete(classHistory)
  await db.delete(userRole)
  await db.delete(account)
  await db.delete(session)
  await db.delete(user)
  await db.delete(section)
  await db.delete(course)
  await db.delete(room)
  await db.delete(slot)
  await db.delete(rolePermission)
  await db.delete(permission)
  await db.delete(role)

  console.log("🌱 Seeding roles...")
  await db.insert(role).values(
    roleData.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
      updatedBy: r.updated_by,
      deletedBy: r.deleted_by,
    })),
  )

  console.log("Seeding permissions...")
  await db.insert(permission).values(
    permissionData.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
      deletedAt: p.deleted_at ? new Date(p.deleted_at) : null,
      updatedBy: p.updated_by,
      deletedBy: p.deleted_by,
    })),
  )

  console.log("Seeding role permissions...")
  await db.insert(rolePermission).values(
    rolePermissionData.map((rp) => ({
      roleId: rp.role_id,
      permissionId: rp.permission_id,
    })),
  )

  console.log("Seeding sections...")
  const sections = await seedSections(db)
  console.log("Seeding courses...")
  const courses = await seedCourses(db)
  console.log("Seeding rooms...")
  const rooms = await seedRooms(db)
  console.log("Seeding slots...")
  const slots = await seedSlots(db)

  console.log("Seeding users, accounts, user_role...")
  const roles = roleData
  const users = await seedUsersAndAccounts(db, sections, roles)

  console.log("Seeding class schedules...")
  await seedClassSchedule(db, sections, courses, rooms, slots, users, roles)

  console.log("Seeding class history...")
  await generateWeeklyClassHistory()

  console.log("✅ Seeding completed!")
}

seed().catch((e) => {
  console.error("❌ Seeding failed:", e)
  process.exit(1)
})
