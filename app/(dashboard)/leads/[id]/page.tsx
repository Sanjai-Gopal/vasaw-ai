import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Rocket,
  Star,
  Store,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { leads } from "@/lib/data/leads";
import { messages } from "@/lib/data/messages";
import { websites } from "@/lib/data/websites";
import { deployments } from "@/lib/data/websites";
import { leadStatusMeta, websiteStatusMeta, deploymentStatusMeta, messageStatusMeta } from "@/lib/status";
import { formatDateTime, formatDate } from "@/lib/utils";

const priorityVariant: Record<"high" | "medium" | "low", "destructive" | "warning" | "muted"> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#1a1a20" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = leads.find((l) => l.id === id);
  if (!lead) notFound();

  const statusMeta = leadStatusMeta[lead.status];
  const leadMessages = messages.filter((m) => m.leadId === lead.id);
  const leadWebsite = websites.find((w) => w.leadId === lead.id);
  const leadDeployment = deployments.find((d) => d.leadId === lead.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
      </div>

      <PageHeader
        title={lead.businessName}
        description={`${lead.id} · Discovered ${formatDate(lead.createdAt)}`}
      >
        <Badge variant={priorityVariant[lead.priority]}>{lead.priority} priority</Badge>
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Business information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-primary" />
              Business information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Category"
              value={
                <>
                  {lead.category}
                  {lead.scraped.subCategory && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      · {lead.scraped.subCategory}
                    </span>
                  )}
                </>
              }
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={lead.scraped.address}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={<span className="font-mono">{lead.phone}</span>}
            />
            {lead.email && (
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={lead.email}
              />
            )}
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Hours"
              value={lead.scraped.hours}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Updated"
              value={formatDateTime(lead.updatedAt)}
            />
          </CardContent>
        </Card>

        {/* AI qualification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-primary" />
              AI qualification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <ScoreGauge score={lead.opportunity.score} />
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Website</span>
                  <Badge variant={lead.qualification.hasWebsite ? "warning" : "destructive"}>
                    {lead.qualification.hasWebsite ? "Has website" : "No website"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <Badge variant={lead.qualification.hasWhatsApp ? "success" : "muted"}>
                    {lead.qualification.hasWhatsApp ? "Active" : "None"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reviews</span>
                  <Badge variant="success">Verified</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response likelihood</span>
                  <Badge variant="info">{lead.qualification.responseLikelihood}</Badge>
                </div>
              </div>
            </div>
            <Separator className="mb-4" />
            <p className="text-sm text-muted-foreground">{lead.qualification.notes}</p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Opportunity reasons
              </p>
              <ul className="space-y-1.5">
                {lead.opportunity.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-sm">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline status</CardTitle>
            <CardDescription>Where this lead stands right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  Website
                </span>
                {leadWebsite ? (
                  <Badge variant={websiteStatusMeta[leadWebsite.status].variant}>
                    {websiteStatusMeta[leadWebsite.status].label}
                  </Badge>
                ) : (
                  <Badge variant="muted">Not started</Badge>
                )}
              </div>
              {leadWebsite && leadWebsite.status === "building" && (
                <div className="mt-2">
                  <Progress value={leadWebsite.buildProgress} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {leadWebsite.buildProgress}% · {leadWebsite.pages} pages ·{" "}
                    {leadWebsite.template} template
                  </p>
                </div>
              )}
              {leadWebsite?.liveUrl && (
                <a
                  href={leadWebsite.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-xs text-info hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {leadWebsite.liveUrl.replace("https://", "")}
                </a>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Rocket className="h-4 w-4" />
                  Deployment
                </span>
                {leadDeployment ? (
                  <Badge variant={deploymentStatusMeta[leadDeployment.status].variant}>
                    {deploymentStatusMeta[leadDeployment.status].label}
                  </Badge>
                ) : (
                  <Badge variant="muted">Not started</Badge>
                )}
              </div>
              {leadDeployment?.liveUrl && (
                <a
                  href={leadDeployment.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-info hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {leadDeployment.liveUrl.replace("https://", "")}
                </a>
              )}
              {leadDeployment?.commitHash && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  commit {leadDeployment.commitHash}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </span>
                {leadMessages.length > 0 ? (
                  <Badge
                    variant={
                      messageStatusMeta[
                        [...leadMessages].sort(
                          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )[0].status
                      ].variant
                    }
                  >
                    {leadMessages.length} message{leadMessages.length > 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge variant="muted">Not contacted</Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {leadMessages.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                    <span className={m.direction === "inbound" ? "text-info" : "text-muted-foreground"}>
                      {m.direction === "inbound" ? "Reply" : "Outreach"} · {messageStatusMeta[m.status].label}
                    </span>
                    {m.replyClassification && (
                      <Badge variant="info">{m.replyClassification.replace(/_/g, " ")}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scraped information + activity timeline */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scraped information</CardTitle>
            <CardDescription>
              Source: {lead.scraped.source} · Scraped {formatDateTime(lead.scraped.scrapedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {lead.rating.toFixed(1)} rating
              </Badge>
              <Badge variant="outline">{lead.reviews} reviews</Badge>
              {lead.scraped.hours && <Badge variant="outline">{lead.scraped.hours}</Badge>}
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Services offered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lead.scraped.services.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity timeline</CardTitle>
            <CardDescription>Everything VASAW AI has done with this lead</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-5">
              <li className="relative">
                <span className="absolute -left-[26px] mt-1 h-2.5 w-2.5 rounded-full bg-violet-400" />
                <p className="text-sm font-medium">Lead discovered & scraped</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(lead.createdAt)}</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[26px] mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                <p className="text-sm font-medium">Qualified by AI</p>
                <p className="text-xs text-muted-foreground">
                  Opportunity score {lead.opportunity.score} · priority {lead.priority}
                </p>
              </li>
              {leadWebsite && (
                <li className="relative">
                  <span
                    className={`absolute -left-[26px] mt-1 h-2.5 w-2.5 rounded-full ${
                      leadWebsite.status === "deployed"
                        ? "bg-emerald-400"
                        : leadWebsite.status === "failed"
                          ? "bg-rose-400"
                          : "bg-amber-400"
                    }`}
                  />
                  <p className="text-sm font-medium">Website {websiteStatusMeta[leadWebsite.status].label.toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(leadWebsite.builtAt ?? leadWebsite.createdAt)}
                  </p>
                </li>
              )}
              {leadDeployment && (
                <li className="relative">
                  <span className="absolute -left-[26px] mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <p className="text-sm font-medium">
                    Deployment {deploymentStatusMeta[leadDeployment.status].label.toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(leadDeployment.deployedAt ?? leadDeployment.createdAt)}
                  </p>
                </li>
              )}
              {leadMessages.map((m) => (
                <li key={m.id} className="relative">
                  <span
                    className={`absolute -left-[26px] mt-1 h-2.5 w-2.5 rounded-full ${
                      m.direction === "inbound" ? "bg-cyan-400" : "bg-primary"
                    }`}
                  />
                  <p className="text-sm font-medium">
                    {m.direction === "inbound" ? "WhatsApp reply received" : "WhatsApp message sent"}
                    {m.replyClassification && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        · classified {m.replyClassification.replace(/_/g, " ")}
                      </span>
                    )}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{m.content}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateTime(m.sentAt ?? m.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Open WhatsApp thread
              </Button>
              <Button size="sm" className="gap-1.5" disabled={!leadWebsite || leadWebsite.status === "deployed"}>
                <Rocket className="h-4 w-4" />
                Request deploy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}