# Social publishing — what the APIs actually allow

This is the one area where the original requirement could not be met literally, so the limits are
documented first and the mechanism second.

---

## Two facts that shape everything

**1. No API can edit your LinkedIn profile's "Experience" section.**
LinkedIn's self-serve APIs let an application *publish posts* on behalf of a member. They do not
expose profile sections. Nothing in this project writes to your experience list on LinkedIn, and no
amount of credential setup would change that.

**2. Meta does not allow posting to a personal Facebook profile.**
The Graph API publishes to a Facebook **Page** (`/<page-id>/feed`). Personal-profile feed posting
was removed years ago. If you do not have a Page, Facebook publishing is simply unavailable — the
manual share links still work.

So "update the relevant parts of my social accounts" is delivered as **publish a post about it**,
with a manual fallback that works today with zero credentials.

## The three paths, in order of reliability

| Path | Credentials needed | Works today? |
|------|-------------------|--------------|
| **Prefilled manual share links** | none | **yes** |
| LinkedIn API posting | your own LinkedIn app + *Share on LinkedIn* approval | after you set it up |
| Facebook Page posting | a Meta app + a Facebook Page | after you set it up |

### Manual share links (always available)

Every experience and project in the admin panel has a **Manual share** panel. It builds post copy
from the record and gives you:

- a copy-to-clipboard block of the text
- **Share on LinkedIn** → `https://www.linkedin.com/feed/?shareActive=true&text=…`
- **Share on Facebook** → `https://www.facebook.com/sharer/sharer.php?u=…&quote=…`

You click the link, the composer opens prefilled, you press Post. These are plain links, so they
work with JavaScript disabled and with nothing configured. Implementation:
`src/lib/social/manual.ts`.

### LinkedIn API posting

Set in `deploy/.env`:

```
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

Register `{SITE_URL}/api/social/linkedin/callback` as a redirect URI in your LinkedIn app, and
request the **Share on LinkedIn** product (this is what grants the `w_member_social` scope). Then
**Admin → Social → Connect LinkedIn**.

What is implemented, verified against LinkedIn's live documentation:

- 3-legged authorization-code flow (`/oauth/v2/authorization`, `/oauth/v2/accessToken`)
- member identity via `GET https://api.linkedin.com/v2/userinfo` → `sub`
- publishing via `POST https://api.linkedin.com/rest/posts` with `w_member_social`
- a dated API version pin, `Linkedin-Version: 202610`, with the reasoning recorded in
  `src/lib/social/linkedin.ts` — LinkedIn supports each version for at least a year, so this is a
  deliberate pin rather than a moving target

Access tokens last ~60 days. When a call returns 401 the dispatch is marked **Needs reconnect**
rather than retried silently.

### Facebook Page posting

Set in `deploy/.env`:

```
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

Permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`. Redirect URI:
`{SITE_URL}/api/social/facebook/callback`. Then **Admin → Social → Connect Facebook**.

Implemented flow: code exchange → short-lived token → long-lived user token
(`grant_type=fb_exchange_token`) → `GET /<user-id>/accounts` → the Page's own token →
`POST /<page-id>/feed`. Long-lived Page tokens do not expire, which is why the Page token is what
gets stored.

## Token handling

- Tokens are encrypted with **AES-256-GCM** before they touch the database
  (`encryptSecret` in `src/lib/crypto.ts`), keyed by `SOCIAL_TOKEN_KEY`.
- If `SOCIAL_TOKEN_KEY` is missing, `encryptSecret` **throws**. The connect flow therefore fails
  closed: it refuses to run rather than storing a token in plaintext. The admin panel shows the
  provider as "not configured" in that state.
- Tokens are never logged, never returned in a response body and never rendered into HTML.
- OAuth `state` is a random nonce bound to the provider with an HMAC and verified before the code
  is exchanged, so a callback cannot be replayed against a different session.
- Every route under `/api/social/**` calls `requireAdminApi()` and returns 401 JSON without a
  session.

## The dispatch log

Each publish attempt is a `SocialDispatch` row with a status:

| Status | Meaning |
|--------|---------|
| `DRAFT` | Copy prepared, not sent |
| `QUEUED` | Scheduled; publishing runs in `after()` |
| `POSTED` | Succeeded — external id and permalink recorded |
| `FAILED` | Rejected; the error is stored and **Retry** is offered |
| `NEEDS_RECONNECT` | The token is no longer accepted; reconnect the account |

There is no cron. A failed dispatch is retried when you press **Retry**, which is the honest
trade for not running a scheduler container.

## Honest gaps

- Nothing here is verified against the live LinkedIn or Meta APIs end to end, because that needs
  approved applications and a real Page. The request shapes were checked against current
  documentation on 2026-10-15 and are recorded in the adapter files, but the round trip is unproven
  until you connect an account.
- Automatic posting is triggered manually per record. There is no "post every new thing
  automatically" switch.
