# Experience content

The `/experience` page uses the shared catalog filter with two options:
Employment and Independent Work & Ventures. Employment is the default;
legacy `filter=all` URLs also resolve to Employment.

Add roles to `src/data/experience.json`. Every role requires a `category`:

- `employment`: roles held as an employee.
- `independent`: freelance engagements, collaborations, and businesses you own, co-founded, manage, or participate in as a partner.

Use `role` for the precise relationship, such as Freelance Developer,
Collaborating Developer, Founder, Co-founder, or Managing Partner. Use
`company` for the organization or venture and `description` for your actual
responsibilities and contributions. Include technologies and only supplied dates and locations. Company URLs,
logos, dates, and locations are optional. Freelance cards use plain company
names without logos or external links.

Keep records ordered newest first. Roles at the same company appear together
in a timeline; filtering happens before grouping, so a company can include
both employment and independent roles.

Independent entries cover freelance work for Infomax, TalendIT, and nDevers.
Their summaries draw on the supplied project mappings; project details and
links are not displayed in these cards. Company names appear before roles;
single-role cards do not use a timeline or repeat dates.

The user corrected the engagement dates after the initial repository activity
ranges were added. These corrections supersede those ranges:

- Infomax: March 3–5, 2024. The start remains the previously selected first commit date; the user supplied the corrected end date. Display: Mar 2024 - Mar 2024.
- TalendIT: October 1–November 28, 2023, both supplied by the user. Display: Oct 2023 - Nov 2023.
- nDevers: April 29–August 3, 2022. The start remains the previously selected first commit date; the user supplied the corrected end date. Display: Apr 2022 - Aug 2022.

Cards retain the existing month/year format. Do not extend engagement dates
based on later repository maintenance commits. Locations remain omitted until
supplied. Vatida is deferred until a project reference is available.
Freelance engagements are listed after employment records.

Descriptions summarize concrete responsibilities from the reviewed case-study
evidence: API conventions, admission file/metadata handling, survey models,
and inventory interactions. They do not claim measured business impact,
production operation, or exclusive ownership of collaborative PHP work.
The complete knowledge catalog size guard is 525,000 characters (131,250
estimated tokens) to accommodate the expanded freelance evidence; this is
a regression guard, not a change to runtime prompt or provider limits.
