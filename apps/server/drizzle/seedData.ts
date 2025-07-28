import type { db } from "@/db"
import { user } from "@/db/schema/auth"
import { account } from "@/db/schema/auth"
import { classSchedule } from "@/db/schema/class_schedule"
import { course } from "@/db/schema/course"
import { userRole } from "@/db/schema/pbac"
import { room } from "@/db/schema/room"
import { section } from "@/db/schema/section"
import { slot } from "@/db/schema/slot"
import { faker } from "@faker-js/faker"
import { createId } from "../src/lib/helpers/createId"
const now = new Date()

export async function seedSections(db: db) {
  const sectionNames = []
  for (let year = 1; year <= 8; year++) {
    for (const letter of ["A", "B", "C"]) {
      sectionNames.push(`${year}${letter}M`)
    }
  }
  const sectionData = sectionNames.map((name) => ({
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
  }))
  await db.insert(section).values(sectionData)
  return sectionData
}

export async function seedCourses(db: db) {
  const courseCodes = Array.from({ length: 64 }, (_, i) => `CSE${101 + i}`)
  const courseTitles = [
    "Intro to Programming",
    "Data Structures",
    "Algorithms",
    "Database Systems",
    "Operating Systems",
    "Computer Networks",
    "Software Engineering",
    "Artificial Intelligence",
    "Machine Learning",
    "Compiler Design",
    "Web Technologies",
    "Mobile Computing",
    "Cyber Security",
    "Cloud Computing",
    "Distributed Systems",
    "Digital Logic Design",
    "Microprocessors",
    "Computer Architecture",
    "Graphics",
    "Numerical Methods",
    "Theory of Computation",
    "Information Retrieval",
    "Natural Language Processing",
    "Big Data",
    "IoT",
    "Robotics",
    "Bioinformatics",
    "Parallel Computing",
    "Embedded Systems",
    "Network Security",
    "Wireless Networks",
    "Data Mining",
    "Human Computer Interaction",
    "Image Processing",
    "Pattern Recognition",
    "Quantum Computing",
    "Cryptography",
    "VLSI Design",
    "Simulation & Modeling",
    "Game Development",
    "Data Visualization",
    "Social Network Analysis",
    "E-Commerce",
    "ERP Systems",
    "IT Project Management",
    "IT Laws & Ethics",
    "Digital Signal Processing",
    "Control Systems",
    "Fuzzy Logic",
    "Neural Networks",
    "Speech Processing",
    "Virtual Reality",
    "Augmented Reality",
    "Blockchain",
    "Smart Grid",
    "Mobile App Development",
    "Web App Development",
    "Cloud Architecture",
    "DevOps",
    "Software Testing",
    "Software Project Management",
    "Advanced Algorithms",
    "Advanced Databases",
    "Advanced Networks",
    "Advanced Operating Systems",
    "Advanced Web Technologies",
    "Advanced Machine Learning",
  ]
  const courseData = courseCodes.map((code, i) => ({
    id: createId(),
    code,
    title: courseTitles[i % courseTitles.length],
    credits: 3,
    createdAt: now,
    updatedAt: now,
  }))
  await db.insert(course).values(courseData)
  return courseData
}

export async function seedRooms(db: db) {
  const roomNames = [
    "c101",
    "c102",
    "c103",
    "c104",
    "cx101",
    "cx102",
    "cx103",
    "cx104",
    "plab1",
    "plab2",
    "Dlab",
    "CNLab",
    "AI Lab",
    "ML Lab",
    "Graphics Lab",
    "VLSI Lab",
    "c201",
    "c202",
    "c203",
    "c204",
    "cx201",
    "cx202",
    "cx203",
    "cx204",
    "plab3",
    "plab4",
    "IoT Lab",
    "Robotics Lab",
    "Embedded Lab",
    "Security Lab",
    "Cloud Lab",
    "Web Lab",
  ]
  const roomData = roomNames.map((name) => ({
    id: createId(),
    name,
    description: name.includes("Lab") ? "Lab Room" : "Theory Room",
    createdAt: now,
    updatedAt: now,
  }))
  await db.insert(room).values(roomData)
  return roomData
}

export async function seedSlots(db: db) {
  const slotTimes = [
    { start: "09:45", end: "10:25" },
    { start: "10:30", end: "11:10" },
    { start: "11:15", end: "12:05" },
    { start: "12:10", end: "12:50" },
    { start: "13:00", end: "13:40" },
    { start: "13:45", end: "14:25" },
    { start: "14:30", end: "15:10" },
    { start: "15:15", end: "15:55" },
    { start: "16:00", end: "16:40" },
  ]
  const slotData = slotTimes.map((t, i) => ({
    id: createId(),
    slotNumber: i + 1,
    startTime: t.start,
    endTime: t.end,
    createdAt: now,
    updatedAt: now,
  }))
  await db.insert(slot).values(slotData)
  return slotData
}

type Role = {
  id: string
  name: string
  description: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
  updated_by: string | null
  deleted_by: string | null
}

export async function seedUsersAndAccounts(
  db: db,
  sections: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
  }[],
  roles: Role[],
) {
  const userList = []
  const accountList = []
  const userRoleList = []

  let userIdx = 1

  for (const role of roles) {
    if (role.name === "SuperAdmin") continue

    if (role.name === "Chairman") {
      const uid = createId()
      const fullName = faker.person.fullName()
      const email = faker.internet.email({ firstName: fullName.split(" ")[0] })
      userList.push({
        id: uid,
        name: fullName,
        email,
        emailVerified: true,
        roleId: role.id,
        createdAt: now,
        updatedAt: now,
        username: faker.internet.displayName(),
        phone: faker.phone.number({ style: "national" }),
        sectionId: null,
        image: faker.image.avatar(),
        updatedBy: null,
        deletedBy: null,
        deletedAt: null,
      })
      accountList.push({
        id: createId(),
        accountId: uid,
        providerId: "local",
        userId: uid,
        createdAt: now,
        updatedAt: now,
      })
      userRoleList.push({ userId: uid, roleId: role.id })
    }

    if (role.name === "Student" || role.name === "CR") {
      for (const section of sections) {
        const count = role.name === "Student" ? 20 : 1 // 20 students, 1 CR per section
        for (let i = 0; i < count; i++) {
          const uid = createId()
          const fullName = faker.person.fullName()
          const email = faker.internet.email({
            firstName: fullName.split(" ")[0],
          })

          userList.push({
            id: uid,
            name: fullName,
            email,
            emailVerified: true,
            roleId: role.id,
            createdAt: now,
            updatedAt: now,
            username: faker.internet.displayName(),
            phone: faker.phone.number({ style: "national" }),
            sectionId: section.id,
            image: faker.image.avatar(),
            updatedBy: null,
            deletedBy: null,
            deletedAt: null,
          })
          accountList.push({
            id: createId(),
            accountId: uid,
            providerId: "local",
            userId: uid,
            createdAt: now,
            updatedAt: now,
          })
          userRoleList.push({ userId: uid, roleId: role.id })
          userIdx++
        }
      }
    }

    if (role.name === "Teacher") {
      for (let i = 0; i < sections.length + 5; i++) {
        const uid = createId()
        const fullName = faker.person.fullName()
        const email = faker.internet.email({
          firstName: fullName.split(" ")[0],
        })

        userList.push({
          id: uid,
          name: fullName,
          email,
          emailVerified: true,
          roleId: role.id,
          createdAt: now,
          updatedAt: now,
          username: faker.internet.displayName(),
          phone: faker.phone.number({ style: "national" }),
          sectionId: null,
          image: faker.image.avatar(),
          updatedBy: null,
          deletedBy: null,
          deletedAt: null,
        })
        accountList.push({
          id: createId(),
          accountId: uid,
          providerId: "local",
          userId: uid,
          createdAt: now,
          updatedAt: now,
        })
        userRoleList.push({ userId: uid, roleId: role.id })
        userIdx++
      }
    }
  }

  await db.insert(user).values(userList)
  await db.insert(account).values(accountList)
  await db.insert(userRole).values(userRoleList)

  return userList
}
type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

type InsertClassSchedule = {
  id: string
  day: Weekday
  slotId: string
  sectionId: string
  courseId: string
  teacherId: string
  roomId: string
  createdAt: Date
  updatedAt: Date
  deletedBy?: string
  deletedAt?: Date
  updatedBy?: string
}

export async function seedClassSchedule(
  db: db,
  sections: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
  }[],
  courses: {
    id: string
    code: string
    title: string
    credits: number
    createdAt: Date
    updatedAt: Date
  }[],
  rooms: {
    id: string
    name: string
    description: string
    createdAt: Date
    updatedAt: Date
  }[],
  slots: {
    id: string
    slotNumber: number
    startTime: string
    endTime: string
    createdAt: Date
    updatedAt: Date
  }[],
  users: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    roleId: string
    createdAt: Date
    updatedAt: Date
    username: string
    phone: string
    sectionId: string | null
    image: string | null
    updatedBy: string | null
    deletedBy: string | null
    deletedAt: Date | null
  }[],
  roles: {
    id: string
    name: string
    // any other fields if present
  }[],
) {
  // Find the teacher role from roles
  const teacherRole = roles?.find((role) => role.name === "Teacher")
  if (!teacherRole) throw new Error("Teacher role not found")

  // Filter users who have the teacher roleId
  const teacherList = users.filter((u) => u.roleId === teacherRole.id)

  if (teacherList.length === 0) throw new Error("No teachers found")

  const scheduleList: InsertClassSchedule[] = []
  const days: Weekday[] = [
    "monday",
    "tuesday",
    "wednesday",
    "saturday",
    "sunday",
  ]

  const scheduleSetRoom = new Set<string>()
  const scheduleSetTeacher = new Set<string>()
  const scheduleSetSection = new Set<string>()

  let retries = 0
  const maxRetries = 20000

  while (scheduleList.length < 500 && retries < maxRetries) {
    retries++

    const section = sections[Math.floor(Math.random() * sections.length)]
    const slot = slots[Math.floor(Math.random() * slots.length)]
    const course = courses[Math.floor(Math.random() * courses.length)]
    const room = rooms[Math.floor(Math.random() * rooms.length)]
    const teacher = teacherList[Math.floor(Math.random() * teacherList.length)]
    const day = days[Math.floor(Math.random() * days.length)]

    const keyRoom = `${day}-${slot.id}-${room.id}`
    const keyTeacher = `${day}-${slot.id}-${teacher.id}`
    const keySection = `${day}-${slot.id}-${section.id}`

    // Check uniqueness constraints for room, teacher, and section per day and slot
    if (
      scheduleSetRoom.has(keyRoom) ||
      scheduleSetTeacher.has(keyTeacher) ||
      scheduleSetSection.has(keySection)
    ) {
      continue
    }

    scheduleSetRoom.add(keyRoom)
    scheduleSetTeacher.add(keyTeacher)
    scheduleSetSection.add(keySection)

    scheduleList.push({
      id: createId(),
      day,
      slotId: slot.id,
      sectionId: section.id,
      courseId: course.id,
      teacherId: teacher.id,
      roomId: room.id,
      createdAt: now,
      updatedAt: now,
    })
  }

  await db.insert(classSchedule).values(scheduleList)
  return scheduleList
}
