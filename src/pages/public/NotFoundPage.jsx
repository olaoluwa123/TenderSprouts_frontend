import { ActionLink, Container, Sprout } from '@/components/public/primitives'

export function NotFoundPage() {
  return (
    <div className="bg-cream">
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <Sprout className="h-10 w-10 text-brand-500" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Page not found</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight text-ink sm:text-5xl">
          This little sprout wandered off.
        </h1>
        <p className="mt-5 max-w-md text-ink/65">
          The page you were looking for has moved or never existed. Let’s get you back to familiar ground.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ActionLink to="/" size="lg">
            Back to home
          </ActionLink>
          <ActionLink to="/contact" variant="outline" size="lg">
            Contact the school
          </ActionLink>
        </div>
      </Container>
    </div>
  )
}
