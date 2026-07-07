-- 008_agent_context.sql
-- Rich agent profile and enhanced content strategy for dynamic system prompt enrichment

-- Agent profile: rich user/persona context loaded into system prompts
INSERT INTO settings (key, value) VALUES
  ('agent_profile', '{
    "name": "Yannick Maillard",
    "background": "Producteur vidéo pendant 11 ans en Guadeloupe (reconnu, sollicité, réseau solide). Installé à Montréal depuis 4 ans — reconversion vers l''IA et le product management. Vibe coder : construit ses propres outils IA dont Rebirth Content Studio. Parle d''IA en la construisant au quotidien, pas en théorie.",
    "current_role": "Vibe coder / Aspirant Product Manager IA",
    "location": "Montréal, QC",
    "origin": "Guadeloupe",
    "objective": "Décrocher un poste Product Manager IA à Montréal grâce à son contenu LinkedIn et ses projets concrets",
    "differentiators": [
      "Double expertise vidéo + IA — unique dans l''écosystème montréalais",
      "Construit ses propres outils (Rebirth Content Studio, agents Telegram)",
      "Perspective caribéenne dans le tech montréalais",
      "Parcours atypique : créatif devenu builder technique"
    ],
    "audience": {
      "description": "Dirigeants de PME (1-50 salariés) qui n''ont jamais intégré l''IA",
      "age_range": "35-55 ans",
      "pain_points": [
        "Données éparpillées (Excel, papier, WhatsApp)",
        "Tâches répétitives chronophages",
        "Entendent parler d''IA mais ne savent pas par où commencer",
        "Peur de la complexité technique"
      ],
      "industries": ["services", "commerce", "restauration", "professions libérales", "associations"]
    },
    "tone_notes": "Direct, accessible, zéro jargon. Vouvoiement pour l''audience LinkedIn, tutoiement sur Telegram. Comme un café entre pros.",
    "personal_touches": [
      "Carnaval guadeloupéen",
      "Hiver montréalais",
      "Vie de pigiste/freelance",
      "Culture créole et entrepreneuriat antillais"
    ]
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Enhanced content strategy (replaces minimal seed from 001)
UPDATE settings SET value = '{
  "pillars": [
    {
      "key": "build_in_public",
      "label": "Build in Public",
      "weight": 40,
      "description": "Ce que Yannick construit au quotidien avec l''IA. Son outil Rebirth, ses agents, ses automatisations. Captures d''écran, before/after, bugs du jour."
    },
    {
      "key": "vulgarisation",
      "label": "Vulgarisation IA",
      "weight": 35,
      "description": "Décoder l''actu IA pour les non-techs. Traduire les annonces (OpenAI, Anthropic, Google, Mistral) en impact concret pour les PME."
    },
    {
      "key": "retour_terrain",
      "label": "Retour terrain",
      "weight": 25,
      "description": "Résultats mesurables d''entrepreneurs qui ont intégré l''IA. Histoires vraies, avant/après chiffrés, succès ET échecs. Focus : Québec, France, Antilles."
    }
  ],
  "posting_days": ["tuesday", "thursday"],
  "newsletter_day": "friday",
  "target_posts_per_week": 2,
  "avoid_topics": [],
  "preferred_formats": [
    "Accroche choc + storytelling + CTA question ouverte",
    "Stat marquante + explication + leçon pour PME",
    "Before/after concret (capture d''écran ou chiffres)"
  ],
  "cta_styles": [
    "Question ouverte à l''audience",
    "Inviter à partager une expérience similaire",
    "Proposer un échange en DM"
  ],
  "accroche_patterns": [
    "Ce matin j''ai automatisé X. Avant : Y. Maintenant : Z.",
    "[Outil] peut maintenant [action]. Voici ce que ça change pour votre [métier].",
    "Un [métier] de [ville] économise [temps/argent] grâce à l''IA. Voici comment."
  ]
}'::jsonb, updated_at = now()
WHERE key = 'content_strategy';
