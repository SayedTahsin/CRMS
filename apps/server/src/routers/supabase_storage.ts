import { supabase } from "@/lib/supabase-server"
import { protectedProcedure, router } from "@/lib/trpc"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { z } from "zod"

const BUCKET = "pdf"

export const supabaseRouter = router({
  uploadFile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        base64: z.string(),
        courseName: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, type, base64, courseName } = input
      const username = ctx.session.user.id
      const buffer = Buffer.from(base64.split(",")[1], "base64")
      const filePath = `${courseName}/user-${username}/${Date.now()}-${name}`

      await supabase.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: type,
        }),
      )

      const signedUrl = await getSignedUrl(
        supabase,
        new GetObjectCommand({ Bucket: BUCKET, Key: filePath }),
        { expiresIn: 3600 },
      )

      return {
        url: signedUrl,
        path: filePath,
        originalName: name,
      }
    }),

  listFiles: protectedProcedure.query(async ({ ctx }) => {
    const username = ctx.session.user.id
    const prefix = "" // base directory

    const listAllCourses = await supabase.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: "",
        Delimiter: "/",
      }),
    )

    const coursePrefixes = new Set<string>()
    listAllCourses.Contents?.forEach((obj) => {
      const parts = obj.Key?.split("/") || []
      if (parts.length >= 2 && parts[1] === `user-${username}`) {
        coursePrefixes.add(parts[0])
      }
    })

    const allFiles = await Promise.all(
      Array.from(coursePrefixes).map(async (courseName) => {
        const userPrefix = `${courseName}/user-${username}/`

        const result = await supabase.send(
          new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: userPrefix,
          }),
        )

        const files = result.Contents ?? []

        return await Promise.all(
          files.map(async (file) => {
            const signedUrl = await getSignedUrl(
              supabase,
              new GetObjectCommand({ Bucket: BUCKET, Key: file.Key }),
              { expiresIn: 3600 },
            )

            return {
              name: file.Key?.split("/").pop() ?? "",
              signedUrl,
              path: file.Key,
              course: courseName,
              createdAt: file.LastModified?.toISOString() ?? null,
              size: file.Size ?? null,
              error: null,
            }
          }),
        )
      }),
    )

    return allFiles.flat()
  }),

  deleteFile: protectedProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { path } = input
      const expectedPrefix = `user-${ctx.session.user.id}`

      if (!path.includes(expectedPrefix)) {
        throw new Error("You are not authorized to delete this file.")
      }

      await supabase.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: path,
        }),
      )

      return { success: true }
    }),

  listAllResources: protectedProcedure
    .input(
      z.object({
        courseName: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const { courseName, page, limit } = input

      const listResult = await supabase.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: courseName ? `${courseName}/` : "",
        }),
      )

      const allFiles = listResult.Contents ?? []

      const filtered = allFiles.filter((file) => {
        if (!file.Key) return false
        return file.Key.split("/").length === 3 // course/user/filename
      })

      const formatted = await Promise.all(
        filtered.map(async (file) => {
          const parts = file.Key?.split("/")
          const course = parts[0]
          const uploadedBy = parts[1]
          const name = parts[2]

          const signedUrl = await getSignedUrl(
            supabase,
            new GetObjectCommand({ Bucket: BUCKET, Key: file.Key }),
            { expiresIn: 3600 },
          )

          return {
            course,
            uploadedBy,
            name,
            path: file.Key,
            signedUrl,
            createdAt: file.LastModified?.toISOString() ?? null,
            size: file.Size ?? null,
            error: null,
          }
        }),
      )

      const start = (page - 1) * limit
      const paginated = formatted.slice(start, start + limit)

      return {
        data: paginated,
        total: formatted.length,
        page,
        totalPages: Math.ceil(formatted.length / limit),
      }
    }),
})
