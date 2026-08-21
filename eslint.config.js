//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/icons.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@heroicons/*",
                "@hugeicons/*",
                "@phosphor-icons/*",
                "@tabler/icons*",
                "lucide-react",
                "react-icons",
                "react-icons/*",
              ],
              message:
                "Import icons from '@/components/ui/icons' so the app uses the shared Hugeicons system.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["eslint.config.js", ".prettierrc", "prototypes/**", "dist/**"],
  },
]
