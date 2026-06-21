# FEATURE_INVENTORY.md — MimoNotes Feature Inventory

**Generated:** 2026-06-17
**Total Components:** 150+
**Total Features:** 45+

---

## COMPONENT INVENTORY

### Landing (12 components) — Public
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| Header | `landing/header.tsx` | ✅ | Navigation bar |
| Hero | `landing/hero.tsx` | ✅ | Hero section with CTA |
| FeatureHighlights | `landing/feature-highlights.tsx` | ✅ | Feature showcase |
| HowItWorks | `landing/how-it-works.tsx` | ✅ | How it works section |
| PricingSection | `landing/pricing-section.tsx` | ✅ | Pricing tiers |
| ProductShowcase | `landing/product-showcase.tsx` | ✅ | Product demo |
| SecuritySection | `landing/security-section.tsx` | ✅ | Security features |
| SocialProof | `landing/social-proof.tsx` | ✅ | Testimonials |
| TeamSection | `landing/team-section.tsx` | ✅ | Team info |
| FAQSection | `landing/faq-section.tsx` | ✅ | FAQ accordion |
| FinalCTA | `landing/final-cta.tsx` | ✅ | Bottom CTA |
| Footer | `landing/footer.tsx` | ✅ | Site footer |

### Auth (2 components) — Public
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| LoginForm | `auth/login-form.tsx` | ✅ | Email/password login |
| RegisterForm | `auth/register-form.tsx` | ✅ | New user registration |

### Chat (7 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| ChatWindow | `chat/chat-window.tsx` | ✅ | Main chat interface |
| MessageBubble | `chat/message-bubble.tsx` | ✅ | Chat message display |
| SessionSidebar | `chat/session-sidebar.tsx` | ✅ | Chat session list |
| CitationMarker | `chat/citation-marker.tsx` | ✅ | Inline citations |
| SourceCard | `chat/source-card.tsx` | ✅ | Source reference card |
| SourcePreview | `chat/source-preview.tsx` | ✅ | Source preview modal |
| FeedbackBar | `chat/feedback-bar.tsx` | ✅ | Thumbs up/down feedback |

### Dashboard (14 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| GreetingBar | `dashboard/greeting-bar.tsx` | ✅ | Welcome message |
| HeroMetric | `dashboard/hero-metric.tsx` | ✅ | Main KPI card |
| StatCard | `dashboard/stat-card.tsx` | ✅ | Metric card |
| UsageChart | `dashboard/usage-chart.tsx` | ✅ | Usage graph |
| RecentChats | `dashboard/recent-chats.tsx` | ✅ | Recent conversations |
| TopDocuments | `dashboard/top-documents.tsx` | ✅ | Top docs by usage |
| CostSummary | `dashboard/cost-summary.tsx` | ✅ | Cost overview |
| KBStats | `dashboard/kb-stats.tsx` | ✅ | Knowledge base stats |
| SystemHealth | `dashboard/system-health.tsx` | ✅ | Health indicators |
| ActivityFeed | `dashboard/activity-feed.tsx` | ✅ | Recent activity |
| OnboardingChecklist | `dashboard/onboarding-checklist.tsx` | ✅ | Setup progress |
| LeadAlerts | `dashboard/lead-alerts.tsx` | ✅ | New lead notifications |
| EvaluationAnalytics | `dashboard/evaluation-analytics.tsx` | ✅ | Chat quality metrics |
| RetrievalAnalytics | `dashboard/retrieval-analytics.tsx` | ✅ | RAG retrieval stats |

### Documents (5 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| DocumentList | `documents/document-list.tsx` | ✅ | Document table |
| UploadForm | `documents/upload-form.tsx` | ✅ | File upload form |
| DocumentPreview | `documents/document-preview.tsx` | ✅ | Doc preview |
| FolderSidebar | `documents/folder-sidebar.tsx` | ✅ | Folder tree |
| ActionSheet | `documents/action-sheet.tsx` | ✅ | Bulk actions |

### Knowledge (4 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| DocumentExplorer | `knowledge/document-explorer.tsx` | ✅ | KB document tree |
| ChunkViewer | `knowledge/chunk-viewer.tsx` | ✅ | Chunk inspector |
| SimilaritySearch | `knowledge/similarity-search.tsx` | ✅ | Vector search UI |
| SourceViewer | `knowledge/source-viewer.tsx` | ✅ | Source display |

### AI (7 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| PlaygroundEditor | `ai/playground-editor.tsx` | ✅ | Prompt testing |
| CompareMode | `ai/compare-mode.tsx` | ✅ | Side-by-side model compare |
| ModelSelector | `ai/model-selector.tsx` | ✅ | AI model picker |
| ParameterControls | `ai/parameter-controls.tsx` | ✅ | Temperature/token controls |
| PromptEditor | `ai/prompt-editor.tsx` | ✅ | Template editor |
| PromptList | `ai/prompt-list.tsx` | ✅ | Template list |
| PromptVersionList | `ai/prompt-version-list.tsx` | ✅ | Version history |

### Analytics (7 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| ChatAnalytics | `analytics/chat-analytics.tsx` | ✅ | Chat metrics |
| CostAnalytics | `analytics/cost-analytics.tsx` | ✅ | Cost breakdown |
| UsageAnalytics | `analytics/usage-analytics.tsx` | ✅ | Usage trends |
| LeadAnalytics | `analytics/lead-analytics.tsx` | ✅ | Lead conversion |
| ChartCard | `analytics/chart-card.tsx` | ✅ | Reusable chart |
| KPICard | `analytics/kpi-card.tsx` | ✅ | KPI display |
| DateRangeSelector | `analytics/date-range-selector.tsx` | ✅ | Date filter |

### Settings (13 components) — Authenticated
| Component | File | User-Facing | Admin |
|-----------|------|-------------|-------|
| SettingsLayout | `settings/settings-layout.tsx` | ✅ | Settings wrapper |
| SettingsNav | `settings/settings-nav.tsx` | ✅ | Tab navigation |
| SettingsSearch | `settings/settings-search.tsx` | ✅ | Settings search |
| AccountSettings | `settings/account-settings.tsx` | ✅ | Profile edit |
| SecuritySettings | `settings/security-settings.tsx` | ✅ | Password & sessions |
| NotificationSettings | `settings/notification-settings.tsx` | ✅ | Alert prefs |
| APISettings | `settings/api-keys-settings.tsx` | ✅ | API key management |
| AISettingsForm | `settings/ai-settings-form.tsx` | ✅ | AI provider config |
| MCPSettingsForm | `settings/mcp-settings-form.tsx` | ✅ | MCP server config |
| ThemeToggle | `settings/theme-toggle.tsx` | ✅ | Dark/light mode |
| LanguageSelector | `settings/language-selector.tsx` | ✅ | i18n |
| WorkspaceDanger | `settings/workspace-danger.tsx` | ✅ | Delete workspace |

### Workspace (11 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| WorkspaceSettings | `workspace/workspace-settings.tsx` | ✅ | Workspace config |
| WorkspaceSwitcher | `workspace/workspace-switcher.tsx` | ✅ | Switch workspace |
| MemberManagement | `workspace/member-management.tsx` | ✅ | Team members |
| InviteDialog | `workspace/invite-dialog.tsx` | ✅ | Invite modal |
| InvitationList | `workspace/invitation-list.tsx` | ✅ | Pending invites |
| PermissionMatrix | `workspace/permission-matrix.tsx` | ✅ | Role permissions |
| ActivityLog | `workspace/activity-log.tsx` | ✅ | Audit trail |
| BillingDashboard | `workspace/billing-dashboard.tsx` | ✅ | Billing info |
| PlanStatus | `workspace/plan-status.tsx` | ✅ | Current plan |
| UpgradeBanner | `workspace/upgrade-banner.tsx` | ✅ | Upgrade prompt |
| UsageOverview | `workspace/usage-overview.tsx` | ✅ | Resource usage |

### WhatsApp (3 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| WhatsAppSettings | `whatsapp/whatsapp-settings.tsx` | ✅ | WhatsApp config |
| ConversationList | `whatsapp/conversation-list.tsx` | ✅ | Chat list |
| ChatView | `whatsapp/chat-view.tsx` | ✅ | Chat interface |

### Developers (3 components) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| APIDocumentation | `developers/api-documentation.tsx` | ✅ | API docs |
| APIKeysManager | `developers/api-keys-manager.tsx` | ✅ | Key management |
| APIUsageMetrics | `developers/api-usage-metrics.tsx` | ✅ | Usage stats |

### Layout (6 components) — All
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| DashboardShell | `layout/dashboard-shell.tsx` | ✅ | Auth layout wrapper |
| DashboardShellClient | `layout/dashboard-shell-client.tsx` | ✅ | Client layout |
| AppSidebar | `layout/app-sidebar.tsx` | ✅ | Left sidebar nav |
| TopNav | `layout/top-nav.tsx` | ✅ | Top navigation bar |
| MobileNav | `layout/mobile-nav.tsx` | ✅ | Mobile hamburger menu |
| CommandPalette | `layout/command-palette.tsx` | ✅ | Cmd+K search |

### UI Primitives (29 components) — shadcn/ui
Avatar, Badge, BottomSheet, Breadcrumb, Button, Card, Command, ContainerScrollAnimation, Dialog, DropdownMenu, EmptyState, Input, Label, PageHeader, Pagination, Pricing, ScrollFadeIn, Separator, Sheet, Skeleton, SkeletonVariants, Slider, StatusBadge, Switch, Table, Tabs, Textarea, Tooltip, AnimatedHero

### Leads (1 component) — Authenticated
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| LeadsTable | `leads/leads-table.tsx` | ✅ | Lead management table |

### Audit (1 component) — Admin
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| AuditLogViewer | `audit/audit-log-viewer.tsx` | ✅ | Audit trail viewer |

### Widget (1 component) — Admin
| Component | File | User-Facing | Notes |
|-----------|------|-------------|-------|
| WidgetSettingsForm | `widget/widget-settings-form.tsx` | ✅ | Widget config |

---

## LIBRARY INVENTORY (lib/)

| Module | File | Purpose |
|--------|------|---------|
| auth.ts | NextAuth v5 config | JWT strategy, credentials provider |
| prisma.ts | Prisma client singleton | DB connection pool |
| actions.ts | Server actions | register, login, logout |
| ai-provider.ts | Multi-provider AI factory | OpenAI, Ollama, LM Studio, etc. |
| analytics.ts | Event tracking | recordEvent, getAnalytics, exportCSV |
| api-auth.ts | API key authentication | Header-based API auth |
| api-keys.ts | API key management | CRUD for workspace API keys |
| api-rate-limit.ts | API rate limiting | Per-key rate limits |
| api-usage.ts | API usage tracking | Request logging |
| audit.ts | Audit logging | Action trail |
| billing.ts | Billing logic | Plan management, limits |
| stripe.ts | Stripe integration | Checkout, portal, webhook |
| entitlements.ts | Feature gating | Plan-based feature access |
| rbac.ts | Role-based access control | Owner/Admin/Member/Viewer |
| invitations.ts | Workspace invitations | Token-based invite flow |
| lead-intent.ts | Lead intent detection | harga/beli/booking/demo detection |
| notifications.ts | Notification system | Email + in-app alerts |
| ratelimit.ts | Rate limiting | Upstash or in-memory |
| settings.ts | DB settings | Key-value config with cache |
| streaming.ts | AI streaming | SSE response helper |
| usage.ts | Usage tracking | Quota enforcement |
| crypto.ts | Cryptography | Token generation |
| logger.ts | Logging | Structured logging |
| widget.ts | Widget utilities | Widget config helpers |
| url-security.ts | URL validation | SSRF protection |
| processing-queue.ts | Queue system | Async doc processing |
| date-utils.ts | Date helpers | Timezone, formatting |
| middleware/tenant.ts | Multi-tenant middleware | Workspace isolation |

### RAG Pipeline (lib/rag/)
| Module | File | Purpose |
|--------|------|---------|
| chain.ts | RAG chain | generateRAGResponse, streamRAGResponse |
| chunker.ts | Text chunking | Paragraph → sentence splitting |
| embedder.ts | Embedding generation | API + local fallback |
| parser.ts | Document parser | PDF, DOCX, TXT, CSV, XLSX, URL |
| vectorstore.ts | pgvector store | INSERT + cosine similarity |
| image-processor.ts | Image processing | OCR via PaddleOCR |
| vision-provider.ts | Vision AI | Image understanding |
| embedding-providers/ | Multi-provider embeddings | OpenAI, feature hashing |
| embedding-providers/dimension-adapter.ts | Dimension handling | Vector size normalization |
| embedding-providers/factory.ts | Provider factory | Auto-select provider |
| embedding-providers/feature-hashing-provider.ts | Local fallback | Feature hashing embedding |
| embedding-providers/openai-provider.ts | OpenAI embeddings | text-embedding-3-small |

### Email (lib/email/)
| Module | File | Purpose |
|--------|------|---------|
| index.ts | Email dispatcher | Send email via configured provider |
| resend-provider.ts | Resend API | Email via Resend |
| smtp-provider.ts | SMTP | Email via SMTP |
| templates.ts | Email templates | HTML email templates |
| logging.ts | Email logging | Send audit |
| types.ts | Types | Email interfaces |

### MCP (lib/mcp/)
| Module | File | Purpose |
|--------|------|---------|
| client.ts | MCP client | Connect to MCP servers |
| manager.ts | MCP manager | Server lifecycle |
| server.ts | MCP server | Expose MimoNotes as MCP |
| tools.ts | MCP tools | Tool definitions |
| types.ts | Types | MCP interfaces |

### WhatsApp (lib/whatsapp/)
| Module | File | Purpose |
|--------|------|---------|
| client.ts | Meta Cloud API client | Send/receive messages |
| webhook.ts | Webhook verification | Signature validation |
| processor.ts | Message processing | RAG pipeline for WhatsApp |
| leads.ts | Lead integration | WhatsApp lead capture |
