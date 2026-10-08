# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Next.js, TypeScript, native WebGL. Local project, GitHub and Vercel intended.
## Product Purpose
Personal portfolio with a centered static introduction and links, no scrolling. Original Android shader is the visual centerpiece.
## Capabilities and Constraints
Touch drag and desktop cursor movement deform the dot field and separate RGB layers. Cursor velocity creates a decaying impulse without clicks. Responsive across aspect ratios, frame-independent motion, bounded rendering resolution. Text cannot be selected. About and contact are short alternate views in the same viewport.
## Brand Commitments
Minimal black background, grayscale dot shader with RGB interaction, centered content. Preserve supplied shader character.
## Evidence on Hand
Original shader in /Users/naranjax/Downloads/shader-background.txt. Lautaro Losio; github.com/LautiLosio and its public profile README supply bio, frontend role at Naranja X, stack and public email. LinkedIn URL supplied by user: linkedin.com/in/lautaro-losio/. Public repositories supply selected projects. No draft notices or gesture hints in UI.
## Product Principles
Content stays readable. Gestures do not interfere with links. No scroll. Performance takes priority over pixel density.

## Shader appearance
User approved original radius, brightness and softness after restoring them. Desktop density is 140 cells per short axis, mobile 70. Threshold 0.1 and soft transition 0.7 explicitly requested. Keep cursor impulse, completed profile and clean footer. Desktop render up to DPR2/4M pixels, mobile DPR1.5/1.6M pixels, adaptive resolution floor of one render pixel per CSS pixel within the budget.

## Public profile wording
Name displayed as Lauti. User requests an evergreen biography with no employer mentioned. Project links include supplied https://comidas.lauti.dev, https://gym.lauti.dev, https://catan.lauti.dev and https://links.lauti.dev alongside selected public GitHub projects.
