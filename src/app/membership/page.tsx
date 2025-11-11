import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"

const FAQ_ITEMS = [
  {
    question: "Do I need to be a marketing major to join?",
    answer:
      "No! AMA at CMU welcomes students from every major who are curious about marketing. Whether you study business, communications, design, data, or another discipline, you’ll gain value by building brands and understanding audiences with us.",
  },
  {
    question: "When can I join?",
    answer:
      "Membership is open year-round. Submit your registration whenever you’re ready and we’ll confirm dues and onboarding within a few business days.",
  },
  {
    question: "How much does membership cost?",
    answer:
      "Dues are $29 for the entire academic year. One payment unlocks every AMA CMU workshop, speaker session, competition, and leadership opportunity.",
  },
  {
    question: "What’s the time commitment?",
    answer:
      "We meet twice a month for chapter updates and host additional programming throughout the semester. Most members stay active with 2–3 hours per month, and you can engage more whenever you’re ready to lead.",
  },
  {
    question: "Are there scholarships or financial aid options?",
    answer:
      "Yes. We reserve a limited number of dues waivers each term so finances never block involvement. Email ama@cmich.edu to request support.",
  },
  {
    question: "How do I officially join?",
    answer:
      "Complete the online registration form, submit dues, and we’ll send onboarding details plus upcoming events. You’ll be plugged into our member chat, mentorship, and project teams.",
  },
  {
    question: "Can I attend before joining?",
    answer:
      "Absolutely. Prospective members are welcome at select open meetings and events—reach out and we’ll point you to the next best session to experience AMA firsthand.",
  },
  {
    question: "Who can I contact with more questions?",
    answer:
      "Email ama@cmich.edu or DM us on Instagram and LinkedIn. Our leadership team is always ready to help you plug in and make the most of AMA.",
  },
]

export default function MembershipPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navigation />
      <main className="flex-1">
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Membership FAQs
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Everything you need to know before becoming part of the American Marketing Association at CMU.
              </p>
            </div>

            <div className="space-y-5">
              {FAQ_ITEMS.map(({ question, answer }) => (
                <Card
                  key={question}
                  className="border border-border/70 bg-background/90 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardContent className="space-y-3 px-6 py-6">
                    <h3 className="text-xl font-semibold text-foreground">{question}</h3>
                    <p className="leading-relaxed text-muted-foreground text-base">{answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
