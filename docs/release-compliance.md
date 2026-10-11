# Release compliance review

Reviewed October 11, 2026 for the local-only Windows desktop application and static GitHub Pages website.

| Control | Status | Evidence or action |
| --- | --- | --- |
| Privacy Policy | Implemented | Full policy at `site/privacy.html`, linked from setup, Settings, and website. |
| Terms of Service | Implemented | Full terms at `site/terms.html`, linked from setup, Settings, and website. |
| Refund Policy | Not applicable | The current release is free and accepts no payment; Terms states this directly. Reassess before monetization. |
| Cookie Policy/banner | Not applicable | Site code sets no cookies and uses no analytics, advertising, embedded media, or forms. Reassess if this changes. |
| Form consent | Not applicable | The website has no data-collection forms. |
| Data minimization | Implemented | No account, telemetry, advertising, cloud database, or publisher-operated API; user-entered data remains local. |
| Third-party SDK audit | Implemented | No tracking SDKs. Runtime dependencies are documented in `THIRD_PARTY_NOTICES.md`; automated dependency audit remains a release gate. |
| Dark patterns/hidden fees | Implemented | Optional setup choices default off; no payment or subscription flow exists; delete/archive consequences are explicit. |
| Reviews and marketing claims | Implemented | Website contains no testimonials, fake reviews, or numerical performance claims. Reassess before adding endorsements. |
| Accessibility | Implemented with manual follow-up | Semantic labels, focus management, keyboard controls, reduced motion/transparency, and AA color samples are present. Manual Windows screen-reader testing remains a release check. |
| Business details | Implemented | Publisher is identified as Shivam D Shinde with a public GitHub contact route. Add a dedicated support address before commercial launch. |
| Children's privacy | Not applicable | General productivity app with no account or publisher-side personal-data collection; no age gate is added. |
| Email unsubscribe | Not applicable | No email or newsletter system exists. |
| Licensed assets | Implemented | System fonts and original project artwork; open-source runtime licenses documented and packaged. |
| Data access/export/deletion | Implemented | Local JSON export, database backup, task/session deletion, and confirmed Clear all data. Policy explains that uninstall may leave user data and recommends clearing first. |
| Installer identity/signing | Accepted risk for current release | Squirrel installs shortcuts and launches the app. V3.0.2 aligns the runtime and shortcut AppUserModelID and supplies the Rurinagi icon for the executable, setup, tray, taskbar, and Apps & Features entry. It remains intentionally unsigned for personal and trusted-user distribution; the website, README, and release notes disclose SmartScreen/Unknown publisher behavior and publish SHA-256 checksums. |

## Release follow-ups

- Obtain and configure a Windows code-signing certificate before broad or commercial distribution, and never represent the current installer as having a verified publisher identity.
- Complete a manual Windows screen-reader pass for the first-run setup and essential workflows.

## Recheck triggers

Re-run this review before every release and whenever accounts, cloud sync, analytics, payments, email, forms, advertising, third-party embeds, child-directed use, or new distribution regions are introduced.

This AI-assisted review is not legal advice and does not replace review by qualified counsel for the product's jurisdictions and business model.
