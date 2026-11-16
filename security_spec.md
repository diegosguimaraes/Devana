# Security Specification & Payload-First Security TDD (Devana)

## 1. Data Invariants
1. **Identity & Email Verification**: All writes require `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation (Split Collection)**: `/users/{userId}` holds only public non-PII attributes (`displayName`, `role`, `specialty`, `hourlyRate`, `reputationScore`, `completedProjects`, `githubUsername`, `avatarUrl`, `bio`). Private PII and notification settings live exclusively in `/users/{userId}/private/{docId}` where only `request.auth.uid == userId` can read or write, and PII is stored as an AES-256-GCM encrypted payload (`encryptedPiiPayload`).
3. **Master Gate Relational Sync**: Every subcollection under `/projects/{projectId}` (`bids`, `worklogs`, `messages`, `reviews`) validates the parent `/projects/{projectId}` document via `get()` on writes and enforces strict relational ownership.
4. **Terminal State Locking**: Once a `Project` reaches `status == 'completed'` or `status == 'cancelled'`, no subsequent updates are allowed on the `Project` document.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`. `createdAt` and ownership fields (`ownerId`, `freelancerId`, `senderId`, `reviewerId`, `projectId`) are immutable after creation.
6. **Secure List Queries (Zero Client Delegation)**: All `allow list` rules explicitly evaluate `resource.data` without calling `get()` or `exists()` inside `list`.
7. **Append-Only Escrow Ledger (`0%` Commission)**: `/projects/{projectId}/escrow_ledger/{entryId}` is strictly immutable (`allow update, delete: if false`), permits reads/writes only by project participants (`ownerId` or `assignedFreelancerId`), validates `state` (`pending | in_escrow | released | refunded`), `idempotencyKey`, and locks `commissionAmount == 0`.
8. **Participant-Scoped Private Subcollections & Authenticated WS**: Reading `bids` requires being the project owner or bid author; reading `worklogs` or `messages` requires being a verified participant of the parent project. Realtime `/ws` handshakes verify Firebase ID Token, HTTP `Origin`, and project room membership via Firestore REST.

## 2. The "Dirty Dozen" Adversarial Payloads (+ Escrow & Ledger Extensions)
1. **Unverified Email Spoof**: Write to `/projects/proj_1` where `auth.uid == 'user_1'` but `auth.token.email_verified == false` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection (Mass Assignment)**: Update `/users/user_1` with `{ displayName: 'Alice', isAdmin: true }` -> `PERMISSION_DENIED` via `hasOnly()`.
3. **Cross-User PII Leak**: Authenticated `user_2` attempts `get` on `/users/user_1/private/settings` -> `PERMISSION_DENIED`.
4. **ID Poisoning Attack**: Create `/projects/{150_char_junk_id}` -> `PERMISSION_DENIED` via `isValidId()`.
5. **Identity Spoofing on Project Creation**: `user_1` creates a project with `ownerId: 'user_2'` -> `PERMISSION_DENIED`.
6. **Terminal State Re-opening**: Update a project whose existing `status == 'completed'` back to `'in_progress'` -> `PERMISSION_DENIED`.
7. **Orphaned Bid Creation**: Create `/projects/non_existent/bids/bid_1` where parent project does not exist -> `PERMISSION_DENIED`.
8. **Unauthorized Worklog Injection**: Non-assigned freelancer logs hours on `/projects/proj_1/worklogs/wl_1` -> `PERMISSION_DENIED`.
9. **Invalid Commit Hash Format**: Create worklog with `commitHash: 'not-a-hex-sha!!'` -> `PERMISSION_DENIED`.
10. **Forged Client Timestamp**: Create message with `createdAt` in the past or future (`!= request.time`) -> `PERMISSION_DENIED`.
11. **Unbounded String Denial-of-Wallet**: Send a 50,000-character string in `description` or `text` -> `PERMISSION_DENIED`.
12. **Blanket List Scraping on Bids**: User `user_3` (neither project owner nor bid author) attempts `list` on `/projects/proj_1/bids` -> `PERMISSION_DENIED`.
13. **Cross-User Chat / Worklog Snooping**: Non-participant `user_3` attempts `get` on `/projects/proj_1/messages/msg_1` or `worklogs/wl_1` -> `PERMISSION_DENIED`.
14. **Escrow Ledger Tampering**: Any user (even project owner) attempts `update` or `delete` on `/projects/proj_1/escrow_ledger/entry_1` -> `PERMISSION_DENIED`.
15. **Non-Zero Commission Injection**: Participant attempts to create an `escrow_ledger` entry with `commissionAmount > 0` -> `PERMISSION_DENIED`.

