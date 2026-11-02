"use server";

import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin/auth";
import {
  checkbox,
  finish,
  intField,
  makeSlug,
  refreshPublicSite,
} from "@/lib/admin/common";
import { rows, sql } from "@/lib/db";
import { resumeBlobToken } from "@/lib/resumes";
import { field } from "@/lib/validation";

const JOBS = "/admin/careers?tab=jobs";
const APPS = "/admin/careers?tab=applications";
const JOB_TYPES = [
  "full-time",
  "part-time",
  "freelance",
  "internship",
  "remote",
];
const APP_STATUSES = ["new", "reviewing", "shortlisted", "rejected", "hired"];

export async function saveJob(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = id ? `${JOBS}&form=edit&id=${id}` : `${JOBS}&form=add`;
  const opt = (name: string) => field(fd, name) || null;

  const title = field(fd, "title");
  const description = String(fd.get("description") ?? "").trim(); // HTML allowed, as on the PHP admin
  if (!title || !description)
    await finish("error", "Title and description are required.", back);
  const type = JOB_TYPES.includes(field(fd, "type"))
    ? field(fd, "type")
    : "full-time";
  const department = field(fd, "department") || "Engineering";
  const location = field(fd, "location") || "Ghaziabad, UP (Remote OK)";
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(field(fd, "deadline"))
    ? field(fd, "deadline")
    : null;
  const requirements = String(fd.get("requirements") ?? "").trim() || null;
  const [skills, experience, salary] = [
    opt("skills"),
    opt("experience"),
    opt("salary_range"),
  ];
  const [active, featured, sortOrder] = [
    checkbox(fd, "is_active"),
    checkbox(fd, "is_featured"),
    intField(fd, "sort_order"),
  ];

  try {
    if (id) {
      await sql`
        UPDATE career_jobs SET title = ${title}, type = ${type}, department = ${department}, location = ${location}, description = ${description},
          requirements = ${requirements}, skills = ${skills}, experience = ${experience}, salary_range = ${salary}, deadline = ${deadline},
          is_active = ${active}, is_featured = ${featured}, sort_order = ${sortOrder}
        WHERE id = ${id}
      `;
    } else {
      // The slug is fixed at creation (existing links keep working after a rename); clashes get a timestamp, as before.
      let slug = makeSlug(title) || "job";
      const [clash] = await rows<{ id: number }>(
        sql`SELECT id FROM career_jobs WHERE slug = ${slug}`,
      );
      if (clash) slug += `-${Math.floor(Date.now() / 1000)}`;
      await sql`
        INSERT INTO career_jobs (title, slug, type, department, location, description, requirements, skills, experience, salary_range,
                                 deadline, is_active, is_featured, sort_order)
        VALUES (${title}, ${slug}, ${type}, ${department}, ${location}, ${description}, ${requirements}, ${skills}, ${experience}, ${salary},
                ${deadline}, ${active}, ${featured}, ${sortOrder})
      `;
    }
  } catch (err) {
    console.error("[saveJob]", err);
    await finish(
      "error",
      id ? "Failed to update job." : "Failed to add job.",
      back,
    );
  }
  refreshPublicSite();
  await finish(
    "success",
    id ? "Job updated successfully." : `Job "${title}" added successfully.`,
    JOBS,
  );
}

export async function deleteJob(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM career_jobs WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Job deleted.", JOBS);
}

export async function updateApplication(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const status = APP_STATUSES.includes(field(fd, "status"))
    ? field(fd, "status")
    : "new";
  const notes = String(fd.get("admin_notes") ?? "").trim() || null;
  await sql`UPDATE career_applications SET status = ${status}, admin_notes = ${notes}, is_read = 1 WHERE id = ${id}`;
  await finish("success", "Application updated.", `${APPS}&view=${id}`);
}

export async function deleteApplication(fd: FormData) {
  await requireAdmin();
  const [row] = await rows<{ resume_file: string | null }>(
    sql`DELETE FROM career_applications WHERE id = ${intField(fd, "id")} RETURNING resume_file`,
  );
  // New resumes live in private Blob storage; legacy ones were files on the old server.
  const file = row?.resume_file;
  if (file?.startsWith("https://") && resumeBlobToken()) {
    await del(file, { token: resumeBlobToken() }).catch((err) => console.error("[deleteApplication]", err));
  }
  await finish("success", "Application deleted.", APPS);
}
