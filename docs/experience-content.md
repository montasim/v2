# Experience content

The `/experience` page uses the shared catalog filter with three options:
All experience, Employment, and Independent Work & Ventures.

Add roles to `src/data/experience.json`. Every role requires a `category`:

- `employment`: roles held as an employee.
- `independent`: freelance engagements, collaborations, and businesses you own, co-founded, manage, or participate in as a partner.

Use `role` for the precise relationship, such as Freelance Developer,
Collaborating Developer, Founder, Co-founder, or Managing Partner. Use
`company` for the organization or venture and `description` for your actual
responsibilities and contributions. Include the dates, location, technologies,
and organization logo using the same fields as the existing entries.

Keep records ordered newest first. Roles at the same company appear together
in a timeline; filtering happens before grouping, so a company can include
both employment and independent roles.

Existing records are classified as employment. No independent engagements
have been added without supplied details. The independent filter shows an
empty state until those records are available.
