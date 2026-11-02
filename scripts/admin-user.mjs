// Manage admin panel accounts from the terminal (run inside web/):
//   node scripts/admin-user.mjs list
//   node scripts/admin-user.mjs create <username> <email> ["Full Name"]   → asks for a password
//   node scripts/admin-user.mjs reset <username>                           → asks for a new password, unlocks
//   node scripts/admin-user.mjs unlock <username>                          → clears failed-login lockout
//   node scripts/admin-user.mjs disable|enable <username>
// The password is typed at a hidden prompt (never on the command line, so it stays out of shell history).
// Sign-in codes go to the account's email, so use an address you can read.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const sql = neon(process.env.DATABASE_URL);
const [cmd, username, email, fullName] = process.argv.slice(2);

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

/** Reads a line without echoing it. ADMIN_PASSWORD can supply it for non-interactive use. */
function askHidden(question) {
  if (process.env.ADMIN_PASSWORD) return Promise.resolve(process.env.ADMIN_PASSWORD);
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : "");
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function newPassword() {
  const pw = await askHidden("New password: ");
  // Same rule as Admin → Settings → Change password.
  if (pw.length < 10 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) fail("Use at least 10 characters with letters and numbers.");
  if (!process.env.ADMIN_PASSWORD && (await askHidden("Repeat password: ")) !== pw) fail("Passwords don't match.");
  return bcrypt.hash(pw, 12);
}

async function findUser() {
  if (!username) fail("Give a username.");
  const [u] = await sql`SELECT id, username FROM admin_users WHERE username = ${username}`;
  if (!u) fail(`No admin called "${username}". Run "list" to see accounts.`);
  return u;
}

switch (cmd) {
  case "list": {
    const users = await sql`SELECT id, username, email, full_name, is_active, COALESCE(locked_until > LOCALTIMESTAMP, false) AS locked, last_login FROM admin_users ORDER BY id`;
    if (!users.length) console.log('No admin accounts yet. Create one with: node scripts/admin-user.mjs create <username> <email>');
    for (const u of users) {
      const state = !u.is_active ? "disabled" : u.locked ? "locked" : "active";
      console.log(`#${u.id}  ${u.username.padEnd(16)} ${u.email.padEnd(32)} ${state.padEnd(9)} last login: ${u.last_login ? new Date(u.last_login).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "never"}`);
    }
    break;
  }
  case "create": {
    if (!username || !/^[A-Za-z0-9_.-]{3,50}$/.test(username)) fail('Username: 3–50 letters, numbers, "_", "." or "-".');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("Give a valid email address (sign-in codes are sent there).");
    const [exists] = await sql`SELECT id FROM admin_users WHERE username = ${username}`;
    if (exists) fail(`"${username}" already exists. Use "reset ${username}" to change its password.`);
    const hash = await newPassword();
    await sql`INSERT INTO admin_users (username, email, full_name, password_hash, is_active) VALUES (${username}, ${email.toLowerCase()}, ${fullName ?? null}, ${hash}, 1)`;
    console.log(`✓ Admin "${username}" created. Sign in at /admin/login.`);
    break;
  }
  case "reset": {
    const u = await findUser();
    const hash = await newPassword();
    await sql`UPDATE admin_users SET password_hash = ${hash}, login_attempts = 0, locked_until = NULL, is_active = 1 WHERE id = ${u.id}`;
    console.log(`✓ Password changed for "${u.username}". Any open sessions for this account are signed out.`);
    break;
  }
  case "unlock": {
    const u = await findUser();
    await sql`UPDATE admin_users SET login_attempts = 0, locked_until = NULL WHERE id = ${u.id}`;
    console.log(`✓ "${u.username}" unlocked.`);
    break;
  }
  case "disable":
  case "enable": {
    const u = await findUser();
    await sql`UPDATE admin_users SET is_active = ${cmd === "enable" ? 1 : 0} WHERE id = ${u.id}`;
    console.log(`✓ "${u.username}" ${cmd}d.`);
    break;
  }
  default:
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 8).join("\n").replace(/^\/\/ ?/gm, ""));
}
