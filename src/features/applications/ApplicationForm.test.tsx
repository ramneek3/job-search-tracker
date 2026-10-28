import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_INPUT } from '@/lib/application'
import { ApplicationForm } from './ApplicationForm'

function setup(defaults = EMPTY_INPUT) {
  const onSubmit = vi.fn()
  render(
    <ApplicationForm
      defaultValues={defaults}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      submitLabel="Add application"
    />,
  )
  return { onSubmit, user: userEvent.setup() }
}

describe('ApplicationForm', () => {
  it('shows accessible, field-level errors and does not submit invalid data', async () => {
    const { onSubmit, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    const company = screen.getByLabelText('Company')
    expect(company).toHaveAttribute('aria-invalid', 'true')
    expect(company).toHaveAccessibleDescription('Company is required')
    expect(screen.getByLabelText('Date applied')).toHaveAccessibleDescription(
      /Add the date you applied/,
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values once valid', async () => {
    const { onSubmit, user } = setup()
    await user.type(screen.getByLabelText('Company'), '  Vercel  ')
    await user.type(screen.getByLabelText('Role'), 'Frontend Intern')
    await user.type(screen.getByLabelText('Date applied'), '2026-10-01')
    await user.selectOptions(screen.getByLabelText('Stage'), 'interview')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        company: 'Vercel',
        role: 'Frontend Intern',
        stage: 'interview',
        appliedAt: '2026-10-01',
      }),
      expect.anything(),
    )
  })

  it('lets wishlist items skip the applied date', async () => {
    const { onSubmit, user } = setup({ ...EMPTY_INPUT, stage: 'wishlist' })
    await user.type(screen.getByLabelText('Company'), 'Notion')
    await user.type(screen.getByLabelText('Role'), 'Intern')
    await user.click(screen.getByRole('button', { name: 'Add application' }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('validates the URL format', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Job posting URL'), 'careers page')
    await user.tab()
    expect(await screen.findByText(/Enter a full URL/)).toBeInTheDocument()
  })
})
