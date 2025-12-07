OAuth & Telegram Integration Plan
Goal Description
Implement OAuth registration/login for Google, Facebook, and GitHub. Ensure Telegram verification (linking) is accessible for storage access.

User Review Required
IMPORTANT

The server requires Client IDs and Secrets for Google, Facebook, and GitHub. These must be added to the .env file.

GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
FACEBOOK_APP_ID / FACEBOOK_APP_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
Proposed Changes
Backend (server)
[MODIFY] 
package.json
Add dependencies: passport, passport-google-oauth20, passport-facebook, passport-github2, @types/passport-*.
[MODIFY] 
User.model.ts
Add optional fields: googleId, facebookId, githubId, avatar.
Make password optional (for OAuth users).
[NEW] 
passport.ts
Configure Passport strategies for Google, Facebook, GitHub.
Logic: Find user by Provider ID -> if not found, create new User -> return User.
[MODIFY] 
server.ts
Initialize Passport.
[MODIFY] 
auth.routes.ts
Add routes:
GET /google, GET /google/callback
GET /facebook, GET /facebook/callback
GET /github, GET /github/callback
[MODIFY] 
auth.controllers.ts
Add callback handlers to generate JWT and redirect to Frontend (e.g., http://localhost:3000/login?token=...).
Frontend (nimbus)
[MODIFY] 
page.tsx
Add "Sign in with Google/Facebook/GitHub" buttons.
Handle token query parameter (if present, login user and redirect).
[MODIFY] 
TelegramConnect.tsx
Ensure it handles errors and success states gracefully.
[MODIFY] 
Storage Page
Import 
TelegramConnect
.
Add a check or a "Connect Telegram" button if the user is not connected (or just expose it for now as per "verifying the telegram" request).
Verification Plan
Automated Tests
None currently available for Auth.
Manual Verification
Social Login:
Click "Login with Google".
Approve app.
Verify redirect to Dashboard.
Check Database: User should be created with googleId.
Telegram Linking:
Go to Storage Page.
Click "Connect Telegram".
Enter Phone -> Get Code -> Enter Code.
Verify success message.
Check Database: User should have telegramSession set.