# Inventory and TechnoFire portfolio evidence

Reviewed through GitHub API snapshots on 2026-09-30. All three repositories are public.

## POSDash Client

- Repository: https://github.com/montasim/warehouse-management-client
- Branch: `master`
- Reviewed commit: `76916f89869f7d900f1473f69ccc7709f21cb1cf`
- Repository created: 2022-05-08T14:48:29Z
- Earliest commit returned by paginated history: `5533ac7ed486888f623f87681f057f602db19928` (2022-04-29T16:39:44Z)
- Article: `/blog/connecting-inventory-screens-to-a-separate-api`

## Inventory Management System Server

- Repository: https://github.com/montasim/inventory-management-system-server
- Branch: `master`
- Reviewed commit: `72744ca3b2bbc133a9c99f0eb23bd4a47006c52c`
- Repository created: 2022-07-20T15:29:12Z
- Earliest commit returned by paginated history: `a1e65bb3271ffe306f7af644fdcd1dc968fe1a3d` (2022-07-20T15:29:19Z)
- Article: `/blog/organizing-an-inventory-api-by-resource`

## TechnoFire

- Repository: https://github.com/montasim/TechnoFire
- Branch: `master`
- Reviewed commit: `0086f2a050e2bb791121ec3c80383ca70d5acb9e`
- Repository created: 2021-12-16T06:33:45Z
- Earliest commit returned by paginated history: `937049ff5f8c896a2d5858e2d9d21bce5a74127b` (2021-12-16T06:33:52Z)
- Article: `/blog/building-a-catalog-with-shared-php-pages`

## Implementation evidence

- POSDash: `src/App.js` establishes client routes and partial guard coverage; `src/Hooks/useToken.js` establishes the email/token request; `src/Pages/Inventory/Inventory/Inventory.js` contains item and stock request code. The README identifies `warehouse-management-server` as the companion, so this entry is not paired with the separately requested inventory API.
- Inventory server: `index.js` mounts resource routes and incorrectly maps purchase paths to order modules; `routes/api/products/pharmacy.js` contains MongoDB collection CRUD operations. Only selected non-secret lines were inspected from route files; credential values were not copied.
- TechnoFire: `index.php` composes shared page includes, the PHP file inventory establishes catalog and admin screens, and the README describes MySQLi/MariaDB content and credits Montasim and Abid Hasan Piash. Individual feature ownership is not established.

The README implementation limitations inform the legacy status of each entry. Current deployment behavior was not tested, and old availability claims were not presented as current findings. No live URLs, adoption figures, or performance improvements were added. No environment values, SQL fixture records, or credentials were copied into the portfolio.

Each project has a dedicated case study, derived blog article, custom overview, and six compiled exact answers. The chat catalog now contains 565 answers. The static knowledge size guard is 520,000 characters (130,000 estimated tokens); runtime settings remain unchanged. Focused-context chat tests verify that ordinary provider requests do not include the complete knowledge packet.

## Client-work classification

The portfolio owner subsequently confirmed the projects covered by this note as client work. Their project records now set `clientWork: true`; this classification comes from the owner, not an inference from repository ownership.
