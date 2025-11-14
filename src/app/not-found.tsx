"use client"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-6 py-16 text-center">
      <div className="max-w-xl space-y-6">
        <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
          AMA at CMU
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Something exciting is on the way
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          We&rsquo;re putting the finishing touches on our new digital home. Come back soon to see what
          the American Marketing Association at CMU has been working on.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* <p>Need to get in touch in the meantime?</p> */}
{/* <p> 
            Email us at{" "}
            <a className="font-semibold text-primary underline" href="mailto:ama@cmich.edu">
              ama@cmich.edu
            </a>{" "}
            or follow us on{" "}
            <a
              className="font-semibold text-primary underline"
              href="https://www.instagram.com/amacmu"
              target="_blank"
              rel="n          oreferrer"
            >
              Instagram
            </a>
            .
          </p> */}
        </div>
      </div>
    </main>
  )
}

