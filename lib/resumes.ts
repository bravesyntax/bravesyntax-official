import "server-only";

// Resume uploads for career applications. Files go from the browser straight to a private Vercel Blob store
// (Vercel caps function request bodies at 4.5 MB, below the 5 MB resume limit). A store is either public or
// private, so resumes use their own store, connected in Vercel with the env prefix RESUME_BLOB; the default
// BLOB_READ_WRITE_TOKEN store is the public one for blog/portfolio images.

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_PREFIX = "resumes/";
export const RESUME_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const resumeBlobToken = () => process.env.RESUME_BLOB_READ_WRITE_TOKEN;
export const resumeUploadsEnabled = () => !!resumeBlobToken();
