-- slides.lua -- the QCE26 talk as a deck of slides.
--
-- The slide grammar is the course's, unchanged: a level-2 header starts a
-- slide, a level-1 header opens a segment, an HTML comment is the speaker
-- notes (../quantum-oracle-engineering/slides.lua documents it).  That
-- filter is loaded here and run first.  This file then replaces the one part
-- of its output that belongs to the course rather than to a deck, the <head>
-- and the crumb, with a talk's: a canonical URL that is this page, a crumb
-- back to the site, and structured data for a presentation of the paper.
--
-- The course filter emits its own crumb only for a pagetitle of the form
-- "<lesson> | <course>"; it is replaced here if it appears.

local here = (PANDOC_SCRIPT_FILE or ""):match("^(.*)/") or "."
dofile(here .. "/../quantum-oracle-engineering/slides.lua")
local course = Pandoc

local SITE = "https://shukla.io/"
local URL  = SITE .. "qce26/slides.html"
-- The course's stylesheet and script, from where slides.html lives.  The
-- stylesheet's fonts are relative to the stylesheet, so they follow it.
local SHARED = "../quantum-oracle-engineering/"

local function attr_value(v)
  return (pandoc.utils.stringify(v):gsub('"', "&quot;"))
end

local function jesc(s)
  return (tostring(s):gsub("\\", "\\\\"):gsub('"', '\\"'))
end

-- The way back, and where you are: the site, then this deck.
local function crumb()
  return pandoc.RawBlock("html",
    '<nav id="deck-crumb" class="chrome" aria-label="deck">'
    .. '<a href="' .. SITE .. '">Nishant Shukla</a>'
    .. '<span class="crumb-sep" aria-hidden="true">/</span>'
    .. 'QCE26</nav>')
end

local function head_tags(meta)
  local tags = {}
  local title = meta.pagetitle and pandoc.utils.stringify(meta.pagetitle) or ""
  local desc = meta.description and pandoc.utils.stringify(meta.description)
  tags[#tags + 1] = '<link rel="canonical" href="' .. URL .. '">'
  if desc then
    tags[#tags + 1] = '<meta name="description" content="' .. attr_value(desc) .. '">'
  end
  tags[#tags + 1] = '<meta name="author" content="Nishant Shukla">'
  tags[#tags + 1] = '<meta property="og:type" content="article">'
  tags[#tags + 1] = '<meta property="og:site_name" content="Nishant Shukla">'
  tags[#tags + 1] = '<meta property="og:url" content="' .. URL .. '">'
  tags[#tags + 1] = '<meta property="og:title" content="' .. attr_value(title) .. '">'
  tags[#tags + 1] = '<meta name="twitter:title" content="' .. attr_value(title) .. '">'
  if desc then
    tags[#tags + 1] = '<meta property="og:description" content="' .. attr_value(desc) .. '">'
    tags[#tags + 1] = '<meta name="twitter:description" content="' .. attr_value(desc) .. '">'
  end
  -- `image` in the front matter is a path inside qce26/.
  if meta.image then
    local img = SITE .. "qce26/" .. pandoc.utils.stringify(meta.image)
    tags[#tags + 1] = '<meta name="twitter:card" content="summary">'
    tags[#tags + 1] = '<meta property="og:image" content="' .. attr_value(img) .. '">'
    tags[#tags + 1] = '<meta name="twitter:image" content="' .. attr_value(img) .. '">'
    if meta["image-alt"] then
      tags[#tags + 1] = '<meta property="og:image:alt" content="' .. attr_value(meta["image-alt"]) .. '">'
      tags[#tags + 1] = '<meta name="twitter:image:alt" content="' .. attr_value(meta["image-alt"]) .. '">'
    end
  end
  -- The deck as a presentation of the paper; `paper` in the front matter is
  -- the paper's URL.
  tags[#tags + 1] = '<script type="application/ld+json">{'
    .. '"@context":"https://schema.org","@type":"PresentationDigitalDocument",'
    .. '"name":"' .. jesc(title) .. '",'
    .. (desc and ('"description":"' .. jesc(desc) .. '",') or '')
    .. '"inLanguage":"en",'
    .. (meta.date
        and ('"datePublished":"' .. jesc(pandoc.utils.stringify(meta.date)) .. '",')
        or '')
    .. (meta.modified
        and ('"dateModified":"' .. jesc(pandoc.utils.stringify(meta.modified)) .. '",')
        or '')
    .. '"author":{"@type":"Person","name":"Nishant Shukla","url":"' .. SITE .. '"},'
    .. (meta.paper
        and ('"about":{"@type":"ScholarlyArticle","url":"'
             .. jesc(pandoc.utils.stringify(meta.paper)) .. '"},')
        or '')
    .. '"url":"' .. URL .. '"}</script>'
  -- Must precede pandoc's MathJax script tag; the menu's accessibility
  -- explorer captures arrow keys once a formula takes focus.
  tags[#tags + 1] =
    '<script>window.MathJax={options:{enableMenu:false}};</script>'
  -- The Makefile passes a content hash of the two assets, so a changed
  -- stylesheet or script is never served from a stale browser cache.
  local v = meta.assets and ("?v=" .. attr_value(meta.assets)) or ""
  tags[#tags + 1] = '<link rel="stylesheet" href="' .. SHARED .. 'slides.css' .. v .. '">'
  tags[#tags + 1] = '<script src="' .. SHARED .. 'slides.js' .. v .. '" defer></script>'
  return pandoc.RawBlock("html", table.concat(tags, "\n"))
end

function Pandoc(doc)
  doc = course(doc)
  local first = doc.blocks[1]
  if first and first.t == "RawBlock" and first.text:find('id="deck-crumb"', 1, true) then
    doc.blocks[1] = crumb()
  else
    table.insert(doc.blocks, 1, crumb())
  end
  doc.meta["header-includes"] = pandoc.MetaList({
    pandoc.MetaBlocks({ head_tags(doc.meta) })
  })
  return doc
end
