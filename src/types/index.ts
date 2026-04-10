export type Pillar = 'build_in_public' | 'vulgarisation' | 'retour_terrain'

export type PostStatus = 'idea' | 'draft' | 'ready' | 'scheduled' | 'published' | 'archived'

export type VeilleStatus = 'new' | 'reviewed' | 'used' | 'dismissed'

export type VeilleUrgency = 'immediate' | 'this_week' | 'backlog'

export type SuggestedFormat = 'post' | 'video' | 'both'

export interface Post {
  id: string
  title: string | null
  content: string
  pillar: Pillar | null
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  linkedin_post_id: string | null
  source_veille_id: string | null
  hashtags: string[]
  media_urls: string[]
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface VeilleItem {
  id: string
  title: string
  summary: string | null
  pme_angle: string | null
  source_url: string | null
  source_name: string | null
  suggested_format: SuggestedFormat | null
  urgency: VeilleUrgency | null
  relevance_score: number | null
  status: VeilleStatus
  used_in_post_id: string | null
  raw_data: Record<string, unknown> | null
  detected_at: string
  created_at: string
}

export interface PostAnalytics {
  id: string
  post_id: string
  impressions: number
  likes: number
  comments: number
  shares: number
  clicks: number
  engagement_rate: number | null
  snapshot_at: string
}

export interface Setting {
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export interface DashboardStats {
  totalPosts: number
  publishedThisMonth: number
  draftsCount: number
  avgImpressions: number
  newVeilleItems: number
}

export const PILLAR_LABELS: Record<Pillar, string> = {
  build_in_public: 'Build in Public',
  vulgarisation: 'Vulgarisation IA',
  retour_terrain: 'Retour terrain',
}

export const PILLAR_COLORS: Record<Pillar, string> = {
  build_in_public: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  vulgarisation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  retour_terrain: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const STATUS_LABELS: Record<PostStatus, string> = {
  idea: 'Idée',
  draft: 'Brouillon',
  ready: 'Prêt',
  scheduled: 'Programmé',
  published: 'Publié',
  archived: 'Archivé',
}

export const STATUS_COLORS: Record<PostStatus, string> = {
  idea: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

// Newsletter types
export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced'
export type NewsletterStatus = 'draft' | 'ready' | 'sending' | 'sent'

export interface Subscriber {
  id: string
  email: string
  first_name: string | null
  interests: string[]
  source: string
  status: SubscriberStatus
  subscribed_at: string
  unsubscribed_at: string | null
}

export interface Newsletter {
  id: string
  subject: string
  intro: string | null
  content_html: string | null
  content_json: Record<string, unknown> | null
  status: NewsletterStatus
  scheduled_at: string | null
  sent_at: string | null
  recipient_count: number
  open_count: number
  click_count: number
  unsubscribe_count: number
  created_at: string
  updated_at: string
}

export const NEWSLETTER_STATUS_LABELS: Record<NewsletterStatus, string> = {
  draft: 'Brouillon',
  ready: 'Pret',
  sending: 'En envoi',
  sent: 'Envoye',
}
