import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { companySchema, projectSchema, settingsSchema } from "../domain/journal"
import {
  addJournalPortfolioProject,
  exportWorkJournal,
  saveJournalCompany,
  saveJournalProject,
  saveJournalSettings,
} from "../application/journal"
import type { Setup } from "./journal-page"
import {
  Field,
  Select,
  companyLogo,
  downloadText,
  projectLogo,
  useAction,
  useUnsaved,
} from "./shared"
import type { z } from "zod"

const emptyCompany = (): z.infer<typeof companySchema> => ({
  id: crypto.randomUUID(),
  revision: 0,
  name: "",
  role: "",
  startDate: "",
  endDate: "",
  archived: false,
})
const emptyProject = (): z.infer<typeof projectSchema> => ({
  id: crypto.randomUUID(),
  revision: 0,
  companyId: "",
  name: "",
  description: "",
  archived: false,
})
export function Manage({
  setup,
  refresh,
  onDirty,
}: {
  setup: Setup
  refresh: () => Promise<void>
  onDirty: (dirty: boolean) => void
}) {
  const [catalogCompanyId, setCatalogCompanyId] = useState(
    setup.defaultCompanyId
  )
  const [catalogProjectId, setCatalogProjectId] = useState("")
  const [company, setCompany] = useState(emptyCompany)
  const [companyBaseline, setCompanyBaseline] = useState(() =>
    JSON.stringify(company)
  )
  const [project, setProject] = useState(emptyProject)
  const [projectBaseline, setProjectBaseline] = useState(() =>
    JSON.stringify(project)
  )
  const [preferences, setPreferences] = useState(setup.settings)
  const action = useAction()
  const dirty =
    JSON.stringify(company) !== companyBaseline ||
    JSON.stringify(project) !== projectBaseline ||
    JSON.stringify(preferences) !== JSON.stringify(setup.settings)
  useUnsaved(dirty, onDirty)
  function chooseCompany(value: z.infer<typeof companySchema>) {
    if (
      JSON.stringify(company) !== companyBaseline &&
      !window.confirm("Discard unsaved company edits?")
    )
      return
    setCompany(value)
    setCompanyBaseline(JSON.stringify(value))
  }
  function chooseProject(value: z.infer<typeof projectSchema>) {
    if (
      JSON.stringify(project) !== projectBaseline &&
      !window.confirm("Discard unsaved project edits?")
    )
      return
    setProject(value)
    setProjectBaseline(JSON.stringify(value))
  }
  return (
    <div className="space-y-5">
      {action.feedback}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="-mx-5 -mt-5 border-b px-5 py-3 font-semibold">
              Companies
            </h2>
            <p className="text-sm text-muted-foreground">
              Archiving keeps every historical entry and review.
            </p>
            <div className="flex flex-wrap gap-2">
              {setup.companies.map((item) => (
                <Button
                  key={item.id}
                  className="h-auto min-h-10 max-w-full break-words whitespace-normal"
                  variant="outline"
                  onClick={() =>
                    chooseCompany({
                      ...item,
                      startDate: item.startDate ?? "",
                      endDate: item.endDate ?? "",
                    })
                  }
                >
                  {item.name}
                  {item.archived ? " · Archived" : ""}
                </Button>
              ))}
              <Button
                variant="ghost"
                onClick={() => chooseCompany(emptyCompany())}
              >
                New company
              </Button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void action.run(async () => {
                  const saved = await saveJournalCompany({
                    data: companySchema.parse(company),
                  })
                  const value = {
                    ...saved,
                    startDate: saved.startDate ?? "",
                    endDate: saved.endDate ?? "",
                  }
                  setCompany(value)
                  setCompanyBaseline(JSON.stringify(value))
                  await refresh()
                }, "Company saved.")
              }}
            >
              <fieldset
                disabled={action.busy}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Company name">
                  <Input
                    required
                    maxLength={200}
                    value={company.name}
                    onChange={(event) =>
                      setCompany({ ...company, name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Your role">
                  <Input
                    maxLength={200}
                    value={company.role}
                    onChange={(event) =>
                      setCompany({ ...company, role: event.target.value })
                    }
                  />
                </Field>
                <Field label="Employment start (optional)">
                  <Input
                    type="date"
                    value={company.startDate}
                    onChange={(event) =>
                      setCompany({ ...company, startDate: event.target.value })
                    }
                  />
                </Field>
                <Field label="Employment end (optional)">
                  <Input
                    type="date"
                    min={company.startDate || undefined}
                    value={company.endDate}
                    onChange={(event) =>
                      setCompany({ ...company, endDate: event.target.value })
                    }
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={company.archived}
                    onChange={(event) =>
                      setCompany({ ...company, archived: event.target.checked })
                    }
                  />
                  Archive company
                </label>
                <Button type="submit" className="justify-self-end">
                  Save company
                </Button>
              </fieldset>
            </form>
          </section>
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="-mx-5 -mt-5 border-b px-5 py-3 font-semibold">
              Journal preferences
            </h2>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void action.run(async () => {
                  await saveJournalSettings({
                    data: settingsSchema.parse(preferences),
                  })
                  await refresh()
                }, "Preferences saved.")
              }}
            >
              <fieldset
                disabled={action.busy}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Timezone">
                  <Input
                    required
                    value={preferences.timezone}
                    onChange={(event) =>
                      setPreferences({
                        ...preferences,
                        timezone: event.target.value,
                      })
                    }
                    placeholder="Asia/Dhaka"
                  />
                </Field>
                <Field label="Week starts on">
                  <Select
                    value={preferences.weekStartsOn}
                    onChange={(event) =>
                      setPreferences({
                        ...preferences,
                        weekStartsOn: Number(event.target.value),
                      })
                    }
                  >
                    {[
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button
                  type="submit"
                  className="justify-self-end sm:col-span-2"
                >
                  Save preferences
                </Button>
              </fieldset>
            </form>
          </section>
        </div>
        <div className="min-w-0 space-y-5">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="-mx-5 -mt-5 border-b px-5 py-3 font-semibold">
              Projects
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose any existing portfolio project for a company, or create a
              new project below.
            </p>

            <div className="flex flex-wrap gap-2">
              {setup.projects.map((item) => (
                <Button
                  key={item.id}
                  className="h-auto min-h-10 max-w-full break-words whitespace-normal"
                  variant="outline"
                  onClick={() => chooseProject(item)}
                >
                  {item.name} ·{" "}
                  {
                    setup.companies.find(
                      (record) => record.id === item.companyId
                    )?.name
                  }
                  {item.archived ? " · Archived" : ""}
                </Button>
              ))}
              <Button
                variant="ghost"
                onClick={() => chooseProject(emptyProject())}
              >
                New project
              </Button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void action.run(async () => {
                  const saved = await saveJournalProject({
                    data: projectSchema.parse(project),
                  })
                  setProject(saved)
                  setProjectBaseline(JSON.stringify(saved))
                  await refresh()
                }, "Project saved.")
              }}
            >
              <fieldset
                disabled={action.busy}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Project name">
                  <Input
                    required
                    maxLength={200}
                    value={project.name}
                    onChange={(event) =>
                      setProject({ ...project, name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Company">
                  <Select
                    required
                    disabled={project.revision > 0}
                    value={project.companyId}
                    onChange={(event) =>
                      setProject({ ...project, companyId: event.target.value })
                    }
                  >
                    <option value="">Choose company</option>
                    {setup.companies
                      .filter(
                        (record) =>
                          !record.archived || record.id === project.companyId
                      )
                      .map((record) => (
                        <option
                          key={record.id}
                          value={record.id}
                          data-logo={companyLogo(record.name)}
                        >
                          {record.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Project description">
                    <Textarea
                      maxLength={3000}
                      value={project.description}
                      onChange={(event) =>
                        setProject({
                          ...project,
                          description: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={project.archived}
                    onChange={(event) =>
                      setProject({ ...project, archived: event.target.checked })
                    }
                  />
                  Archive project
                </label>
                <Button type="submit" className="justify-self-end">
                  Save project
                </Button>
              </fieldset>
            </form>
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Add from portfolio catalog
              </summary>
              <div className="mt-4">
                <fieldset
                  disabled={action.busy}
                  className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <Field label="Company for existing project">
                    <Select
                      value={catalogCompanyId}
                      onChange={(event) =>
                        setCatalogCompanyId(event.target.value)
                      }
                    >
                      <option value="">Choose company</option>
                      {setup.companies
                        .filter((record) => !record.archived)
                        .map((record) => (
                          <option
                            key={record.id}
                            value={record.id}
                            data-logo={companyLogo(record.name)}
                          >
                            {record.name}
                          </option>
                        ))}
                    </Select>
                  </Field>
                  <Field label="Existing portfolio project">
                    <Select
                      value={catalogProjectId}
                      onChange={(event) =>
                        setCatalogProjectId(event.target.value)
                      }
                    >
                      <option value="">Choose project</option>
                      {setup.portfolioProjects.map((record) => (
                        <option
                          key={record.id}
                          value={record.id}
                          data-logo={projectLogo(record.title)}
                        >
                          {record.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    className="self-end"
                    variant="outline"
                    disabled={!catalogCompanyId || !catalogProjectId}
                    onClick={() => {
                      if (
                        JSON.stringify(project) !== projectBaseline &&
                        !window.confirm(
                          "Discard unsaved project edits and open the selected project?"
                        )
                      )
                        return
                      void action.run(async () => {
                        const saved = await addJournalPortfolioProject({
                          data: {
                            companyId: catalogCompanyId,
                            portfolioProjectId: catalogProjectId,
                          },
                        })
                        setProject(saved)
                        setProjectBaseline(JSON.stringify(saved))
                        await refresh()
                      }, "Project is ready to select for this company.")
                    }}
                  >
                    Add existing project
                  </Button>
                </fieldset>
              </div>
            </details>
          </section>
          <section className="space-y-3 rounded-xl border bg-card p-5">
            <h2 className="-mx-5 -mt-5 border-b px-5 py-3 font-semibold">
              Your data
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Download all companies, projects, original notes, private
              reflections, and review snapshots as JSON. This is a private
              backup; use Reviews to prepare a selective report for someone
              else.
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    const data = await exportWorkJournal()
                    downloadText(
                      "private-work-journal.json",
                      JSON.stringify(data, null, 2),
                      "application/json"
                    )
                  }, "Private backup downloaded.")
                }
              >
                Download private backup
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
