# Kasente · Android test build

Kasente ("money" in Luganda) is a personal finance app for everyday Ugandans. This folder builds an installable Android app (APK) from the screens you approved, so you can use it on your own phone for a week.

## Get the APK onto your phone

GitHub builds the APK for free in the cloud. You never need Android Studio.

**Option A: let Claude do it.** Connect GitHub to Claude (Settings → Connectors → GitHub), then say "push Kasente and build the APK". Claude creates the repository, starts the build and sends you the APK.

**Option B: do it yourself (about 10 minutes).**

1. Sign in at github.com and create a new **private** repository called `kasente`. Leave "Add a README" unticked.
2. On the empty repository page, click **uploading an existing file**. Drag in everything from inside this folder (not the folder itself) and click **Commit changes**.
3. Check that the `.github/workflows/build-apk.yml` file arrived. Some browsers skip folders whose names start with a dot. If it's missing, click **Add file → Create new file**, type `.github/workflows/build-apk.yml` as the name, paste in the contents of that file, and commit.
4. Open the **Actions** tab. The "Build Kasente APK" run starts by itself and takes about 5 minutes. If the tab asks you to enable workflows, enable them, then click **Run workflow**.
5. When it shows a green tick, open the **Releases** page (right-hand side of the repository home page) on your phone and tap `kasente-test-N.apk`.

## Install it

1. Tap the downloaded APK. Android will say installs from your browser are blocked. Tap **Settings**, allow **Install unknown apps** for that browser, go back and tap **Install**.
2. Play Protect may warn that the app is unknown, because it isn't from the Play Store. Choose **Install anyway**.
3. Open Kasente, answer the two setup questions, and pick **My own money**.
4. When asked, allow **SMS**. Kasente then reads the last 60 days of MTN, Airtel and bank money messages. Allow **notifications** for bill reminders.

Every push to GitHub produces a new build with a higher number. Installing it over the old one keeps your data. Uninstalling deletes the data, so save a backup first (Settings → Backup).

## Your account and OneDrive

People register by signing in with their Microsoft email (Outlook, Hotmail, Live or a work account). Kasente keeps each person's data in **their own OneDrive**, in a private folder at **Apps › Kasente** (file `kasente-data.json`). There is no Kasente server, and nobody else can read it.

- Changes save to OneDrive a few seconds after you make them, and the app checks for newer data when you open it.
- Reinstall, or sign in on a second phone, and your data comes back.
- If two phones change the same data while offline, the most recent save wins.
- Signing in is optional. Without it, everything stays on the phone.
- Google Drive is shown as "coming soon". It needs its own Google sign-in set-up.

**One-time set-up:** sign-in needs a Microsoft app (client) ID. Register the app at entra.microsoft.com → App registrations → New registration:
- Account types: *Accounts in any organizational directory and personal Microsoft accounts*
- Redirect URI: *Public client/native (mobile & desktop)*, `kasente://auth`
- API permissions (Microsoft Graph, delegated): `User.Read`, `Files.ReadWrite.AppFolder`, `offline_access`

Then put the Application (client) ID in `gradle.properties` as `kasenteMsClientId=…`, or add it as a repository secret named `KASENTE_MS_CLIENT_ID`.

## What's new in test build 7

- **MoMo Advance works like MTN's.** Spending past your balance draws on the advance only up to your limit, with MTN's 2.75% access fee and 0.95% daily interest. The wallet reads minus what you owe (for example −UGX 102,750 after using a 100,000 advance). Money coming in repays the advance first, then the full limit is available again. Messages no longer create made-up debt, older messages read late no longer overwrite a newer balance, and earlier inflated advances are rebuilt from real advance events. Each MoMo account has "It's repaid" and "Correct the advance".
- **MoKash and wallet savings** are recorded on the account, counted in what you have, and read from messages.
- **The home graph and account graphs move** with your real transactions over the last 30 days.
- Cash deposits at an agent now add to mobile money (they were subtracted before).

## What's new in test build 4

- **Balances that add up.** Spending more than an account holds leaves it at zero and records the rest as owed (advance on mobile money, overdraft on a bank, shortfall on cash). Home shows money you can use, what you owe, and what's left after debts.
- **Net worth** lives on My money profile, with your photo, name and what you do.
- **Businesses.** Add as many as you run. Each has its own money (cash, mobile money, bank), sales and expenses, clients, profit and loss, and balance sheet, separate from your personal money.
- **Invoices and receipts** with your logo, colours and one of three styles, shaped by questions about the business (a law firm gets fee notes with hours and rates; a shop gets quantities). Shared as PDF files; overdue invoices trigger reminders and a ready-written message to the client.
- **Tax guide (Uganda, 2026/27).** PAYE, rental tax, presumptive tax for small businesses, individual rates for professionals, 30% for companies, the VAT threshold of UGX 300M, exemptions and deadlines (which can be added to Bills). Estimates only.

## What works in this build (test build 3)

| Feature | Status |
|---|---|
| Registration: name, country, currency, language, payday, then accounts with balances, advances and loans, then household | Works. Steps 2 and 3 can be skipped |
| Microsoft sign-in, data kept in your OneDrive | Built, switched on once the Microsoft app ID is added |
| Reading MoMo, Airtel Money, M-Pesa and bank SMS | Works. Also reads advances, loans, recoveries, limits and fees, and messages from Xeno, NSSF and unit trusts |
| Accounts by provider (brand colour badge or your own picture), any African currency | Works. Exchange rates update from the internet |
| Advances and loans per account (used, limit, outstanding) | Works, kept separate from income and spending |
| Receipt scanning | Works. Text is read on the phone (Google ML Kit, offline); you check the items before saving |
| Spending screen: period, category, detail, transport, health, fees, top places, who it was for | Works |
| Personal vs household expenses, children and allowances | Works on one phone |
| My money profile: net worth, what you have, what you owe, assets, wellness score | Works |
| Advisor: Ask, Learn (13 lessons, books, official resources), My review | Works on the phone. Optional Claude answers with your own API key |
| Streaks, points, badges | Works. Prizes to be announced |
| Exports: Excel workbook, PDF (via Android's "Save as PDF"), CSV, each with Open and Share | Works |
| Languages: English, Kiswahili, Français | Main screens translated; longer texts stay in English for now |
| Budgets, bills with reminders, lending, goals, investments, fares, PIN and fingerprint lock, backups | Works |
| WhatsApp bot | In-app preview only. The real bot needs a server |
| Family members on their own phones with shared data | Needs online sync (next phase) |
| Luganda | Waiting for a native-speaker translation |

## A one-week test plan

- **Day 1.** Install, allow SMS, and check the imported transactions against your MoMo history. Open every item marked **Check** and correct it. Set your real budget limits under More → Budgets.
- **Days 2–3.** Log every cash expense the moment it happens, including boda fares. Note anything that takes more than two taps.
- **Day 4.** Add your real bills (UMEME, water, rent, school fees) and one savings goal. Confirm a reminder notification arrives.
- **Day 5.** Ask the advisor three questions you actually care about. Note any answer that's wrong or unhelpful.
- **Day 6.** Save a backup, then export the CSV and open it in Excel or Google Sheets.
- **Day 7.** Write down the three things you'd change first and any SMS that was read wrongly. Copy the message text, hiding names or numbers if you prefer. Real messages are the fastest way to make the reader accurate.

## Project layout

- `web-src/`: the sources the app screens are built from (`kasente.html` prototype, `layer.js`, `l2/*.js` build 3 and 4 features, `i18n.js` translations, `transform.py` which combines them into `app/src/main/assets/index.html`)


- `app/src/main/assets/index.html`: the whole app interface (HTML, CSS and JavaScript, fonts bundled for offline use)
- `app/src/main/java/ug/kasente/app/`: the Android shell
  - `MainActivity.java`: hosts the interface, handles the camera, back button and status bar
  - `Bridge.java`: what the interface can ask the phone for (SMS, files, fingerprint, reminders)
  - `Receipts.java`: reads receipt photos with on-device text recognition
  - `Pdf.java`: turns invoices, receipts and reports into A4 PDF files in Downloads/Kasente
  - `Net.java`: exchange rates and the optional Claude advisor
  - `Cloud.java`: Microsoft sign-in (no password or secret stored) and reading/writing the OneDrive app folder
  - `Reminders.java`, `ReminderReceiver.java`, `BootReceiver.java`: bill and loan notifications
- `app/kasente-test.jks`: a test-only signing key so each build updates the last. Create a new private key before any Play Store release.
- `.github/workflows/build-apk.yml`: the cloud build

## Notes for the Play Store later

Google Play only allows apps to read SMS in a few approved categories, so the Play Store version will need either Google's approval for SMS access or a different capture method. This doesn't affect installing the test APK directly.

The roadmap's Phase 1 calls for Flutter. This test build reuses the approved screens so you can test the ideas now. The Flutter build can follow the same screens and the same SMS rules once the week's feedback is in.
