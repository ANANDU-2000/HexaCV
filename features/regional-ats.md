# 13. Regional ATS Formatting

> Gulf & India hiring norms built in: country-specific address fields, phone/ZIP
> validation, ATS rules, and in-editor regional tips.

**Status:** Implemented.

## Purpose
A resume that parses cleanly in the target market — visa/emirate/city/state handling,
correct phone/ZIP patterns, and grounded keyword alignment.

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| Country data | `client/src/lib/countryData.ts` + `server/countryRoutes.ts` (`/countries`, `/country-ats-rules/:current/:target`) | per-country `locationFields`, `phoneRegex`, `dateFormat`, `addressFormat`, ATS `keywords`, `regionalHiringExpectations`, `preferredFormatting` |
| Location fields | `client/src/components/CountryLocationFields.tsx` | state/district/emirate/county/city/postalCode inputs per target country |
| Validation | `ResumeEditor.calculateATSScore` | phone format vs current country, ZIP/PIN patterns (US 5-digit, IN 6-digit), required location fields |
| Region tips | `JdKeywordMatch` regionTips + **NEW** `ContextualEditor` tip | Gulf: "mention visa status only if you supplied it"; India: "keep structure clear & grounded" |
| Market mapping | `ResumeBuilder.marketToCountryCode` | India→IN, Gulf→AE, US→US, Global→GB |

## ATS score (editor)
`keyword match (50%) + completeness (30%) + readability (20%)`, using the target job's
keywords **plus** the target country's ATS keywords; missing keywords surface as
suggestions. No fabricated percentages in marketing — only found/not-found lists.

## Key details
- Target country is set from the targeting market (Gulf→AE etc.) and editable in the editor.
- Regional hiring expectations feed the "AI Tip" / suggestion lists.
- The landing output gallery showcases region-specific samples (Abu Dhabi, Dubai, Bengaluru, Riyadh).

## Edge cases
- Missing required location field for target country → score deduction + suggestion.
- Phone without the country dial code → flagged against `phoneRegex`.
