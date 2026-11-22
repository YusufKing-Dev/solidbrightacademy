# Solid Bright Academy: website and school management system

Next.js 14 + Prisma + Supabase (Postgres and Storage) + Resend, ready for Vercel.

What it contains: public website (home, about, Pre-Basic, Basic, College, admissions form, announcements, contact), student portal, teacher portal, administrator dashboard, results approval workflow, session and term control, grading system, website content editor, SEO files.

---

## 1. Create the database (Supabase)

1. Create a free project at supabase.com. Save the **database password** you choose.
2. **Project Settings > Database > Connection string**:
   - Choose **Transaction pooler** (port 6543). Copy it. This is `DATABASE_URL`. Add `?pgbouncer=true` at the end if it is not there.
   - Choose **Session pooler** (port 5432). Copy it. This is `DIRECT_URL`.
   - Replace `[YOUR-PASSWORD]` in both with your database password.
3. **Storage > New bucket**: name `sba-uploads`, switch **Public bucket** ON.
4. **Project Settings > API**: copy the **Project URL** (`SUPABASE_URL`) and the **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`). Keep the service_role key secret. Never put it in the browser or in GitHub.

## 2. Create the tables and starting data (once)

You need a terminal with Node 18+. If you only have a phone, use **GitHub Codespaces** (open your repo on github.com, Code > Codespaces > Create). It gives you a terminal in the browser.

```bash
npm install
cp .env.example .env        # then fill in every value in .env
npx prisma db push          # creates all tables in Supabase
npm run db:seed             # classes, subjects, grading, session, admin, teachers, gallery
npm run build               # optional but recommended: checks everything compiles
```

The seed prints the **teacher first passwords once**. Write them down. Every teacher is asked to choose a new password at first login, and you can reset any password in Admin > Teachers.

The seed creates: all 12 classes (KG, Basic 1-5, JSS 1-3, SS 1-3; Basic 1 and SS 2 have no teacher), starter subjects, an A-F grading scale (CA 40 + Exam 60), session 2026/2027 with 1st Term current, your teachers with their classes, and the six gallery photos.

## 3. Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler URL (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase session pooler URL (port 5432), used to create tables |
| `AUTH_SECRET` | Long random text, 32+ characters. Keeps logins secure |
| `NEXT_PUBLIC_SITE_URL` | Live website address, no trailing slash. Used for sitemap and Google |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | First administrator. Used only by `npm run db:seed` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | Image uploads |
| `RESEND_API_KEY`, `EMAIL_FROM` | Admission and contact email notifications |

## 4. Email (Resend)

1. Sign up at resend.com **using solidbrightacademy2011@gmail.com**.
2. Create an API key and set `RESEND_API_KEY`.
3. Keep `EMAIL_FROM="Solid Bright Academy <onboarding@resend.dev>"`. Until a domain is verified in Resend, it can only deliver to the email you signed up with, which is exactly the school address.
4. The address that receives notifications can be changed in Admin > Settings.

If email fails for any reason, the application is still saved and shown in Admin > Applications with an "Email not sent" note.

## 5. Deploy on Vercel

1. Push the project to GitHub (see the note on saving credits below).
2. On vercel.com: **Add New > Project > import the repo**.
3. Before clicking Deploy, add every environment variable from the table above.
4. Deploy. The build command is already set in `package.json`.
5. Open the live address, then `/admin/login`.
6. Add the school domain in Vercel > Settings > Domains, then update `NEXT_PUBLIC_SITE_URL` and redeploy once.

**Saving Vercel free-tier credits:** run `npm run build` in Codespaces or on your computer first. If it passes, one push is enough. Environment variable changes need a redeploy, so set them all before the first deploy.

## 6. Daily use (for the school owner)

- Log in at `/admin/login`.
- **Session and term:** set the current period on the dashboard or in Session and term. All three dashboards and result entry follow it.
- **Register a student:** Students > Register. Give them the admission number and first password (their surname).
- **Portal ON/OFF:** the switch in the Students table. OFF blocks login and results immediately, even for someone already logged in.
- **Results:** teachers submit; you open Results > Review > Approve (and publish) or Reject with a reason.
- **Website:** Website content, Gallery, Announcements, and Settings change the public site with no code.

## 7. Google and search visibility

The code adds titles, descriptions, school structured data, a sitemap at `/sitemap.xml` and robots rules. After launch:

1. **Google Search Console** (search.google.com/search-console): add the site, choose the HTML tag method, paste only the `content` value into Admin > Settings, save, then verify. Submit `sitemap.xml`.
2. **Google Business Profile** (business.google.com): create the school listing with the same address and phones, add photos, ask parents for reviews. This matters most for "near me" and "schools in Ilorin" searches.
3. Share the website link on the school's WhatsApp groups and social pages.

No one can guarantee rankings. New sites typically take weeks to months to appear.

## 8. Test checklist (run on the live site with real test accounts)

**Student**
- [ ] Admin registers a student (admission number + surname). Student logs in with admission number and surname.
- [ ] Student is asked to choose a new password, then sees dashboard with the correct session and term.
- [ ] Student sees no results until a teacher submits, admin approves and publishes.
- [ ] Switch portal OFF: login shows "Your portal access is currently restricted. Please contact the school administration regarding your school fees." A logged-in student is blocked on the next click.
- [ ] Switch ON again: access returns.

**Teacher**
- [ ] Admin creates a teacher, assigns classes. Teacher logs in and sees only those classes.
- [ ] Typing another class's address (for example `/teacher/classes/<other id>`) shows "Page not found".
- [ ] Enter scores, Save draft, Submit. Total and grade are calculated. Scores above the maximum are refused.
- [ ] After submit, the sheet is locked. After rejection, the reason shows and the teacher can fix and resubmit.

**Administrator**
- [ ] Change the current term. Admin, teacher and student dashboards show the new term.
- [ ] Approve and publish; unpublish; correct a score; see the history entries.
- [ ] Create/edit session, subjects, classes, grading. Add an announcement (publish/unpublish).
- [ ] Edit website content and gallery; see changes on the public site.

**Public**
- [ ] Home, About, Pre-Basic, Basic, College, Announcements, Contact load.
- [ ] Submit an admission application: saved in Admin > Applications, email arrives (if Resend is set up).
- [ ] Contact form message appears in Admin > Messages.

## 9. Notes

- Passwords are hashed with bcrypt. Student first passwords are stored lower-cased, so "ADEYEMI" and "Adeyemi" both work until the student changes it.
- Permissions are enforced on the server for every page and action. Hiding buttons is only cosmetic.
- Login attempts are limited (10 wrong tries per account or 40 per connection in 15 minutes).
- Teachers' names in the seed are exactly as supplied (for example "Mrs. Ishola"). Change names or logins in Admin > Teachers.
- Core values are empty on purpose (none were supplied). Add them in Website content.
- The proprietress message is empty by default. Add it in Website content.
- Deleting a student or teacher who has result records is blocked. Deactivate instead.
