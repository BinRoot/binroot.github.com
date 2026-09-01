-- slides.lua -- turn a lesson into a deck of slides.
--
-- A level-1 header opens a segment: it emits no slide of its own, but its
-- title and id are stamped on every following slide (data-segment and
-- data-segment-id) until the next level-1 header.  A level-2 header starts a
-- slide and hands its id and classes to that slide.  Headers inside a slide
-- are promoted one level in the output (the authored ## renders as the
-- slide's h1), so the markdown gains hierarchy while the rendered deck stays
-- unchanged.  HTML comments become speaker notes.  Nothing else in the
-- markdown is markup for the deck.

local BASE = "https://shukla.io/quantum-oracle-engineering/"

local function comment_body(el)
  if el.t ~= "RawBlock" or not el.format:match("^html") then return nil end
  return el.text:match("^%s*<!%-%-(.-)%-%->%s*$")
end

-- The way back, and where you are.  Every deck's pagetitle already reads
-- "<lesson> | <course>", so the crumb needs no metadata of its own and works
-- for any deck that sets one: the course half links to the lessons page, the
-- lesson half names the deck you are in.
--
-- Emitted here rather than by slides.js because a link is navigation and has
-- to survive scripting being off.  The rest of the chrome is script-built and
-- simply is not there without it, which is fine for a counter and fatal for
-- the only way back.
local function html_escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
end

local function crumb(meta)
  local title = meta.pagetitle and pandoc.utils.stringify(meta.pagetitle) or ""
  local lesson, course = title:match("^%s*(.-)%s*|%s*(.-)%s*$")
  if not course or course == "" then return nil end
  return pandoc.RawBlock("html",
    '<nav id="deck-crumb" class="chrome" aria-label="deck">'
    .. '<a href="' .. BASE .. '">' .. html_escape(course) .. '</a>'
    .. '<span class="crumb-sep" aria-hidden="true">/</span>'
    .. html_escape(lesson)
    .. '</nav>')
end

local function attr_value(meta_value)
  return (pandoc.utils.stringify(meta_value):gsub('"', "&quot;"))
end

-- Everything that belongs in <head>.  This lives here rather than in an
-- --include-in-header file because that flag sets the `header-includes`
-- template variable, which shadows the metadata a filter can write, so the
-- per-deck canonical URL would be silently dropped.
local function head_tags(meta)
  local tags = {}
  local url = meta.slug and (BASE .. pandoc.utils.stringify(meta.slug) .. "/")
    or BASE
  if meta.slug then
    tags[#tags + 1] = '<link rel="canonical" href="'
      .. BASE .. attr_value(meta.slug) .. '/">'
  end
  if meta.description then
    tags[#tags + 1] = '<meta name="description" content="'
      .. attr_value(meta.description) .. '">'
  end

  -- Social and search tags, following the same conventions as the blog
  -- posts' heads: og/twitter pairs, absolute image URLs, one JSON-LD block.
  -- og:title drops the " | Quantum Oracle Engineering" suffix that the tab
  -- title carries.
  local title = meta.pagetitle and pandoc.utils.stringify(meta.pagetitle) or ""
  local short = title:match("^(.-)%s*|") or title
  local function jesc(s)
    return (tostring(s):gsub("\\", "\\\\"):gsub('"', '\\"'))
  end
  tags[#tags + 1] = '<meta name="author" content="Nishant Shukla">'
  tags[#tags + 1] = '<meta property="og:type" content="article">'
  tags[#tags + 1] = '<meta property="og:site_name" content="Nishant Shukla">'
  tags[#tags + 1] = '<meta property="og:url" content="' .. attr_value(url) .. '">'
  tags[#tags + 1] = '<meta property="og:title" content="' .. attr_value(short) .. '">'
  tags[#tags + 1] = '<meta name="twitter:title" content="' .. attr_value(short) .. '">'
  if meta.description then
    tags[#tags + 1] = '<meta property="og:description" content="'
      .. attr_value(meta.description) .. '">'
    tags[#tags + 1] = '<meta name="twitter:description" content="'
      .. attr_value(meta.description) .. '">'
  end
  if meta.image then
    local img = BASE .. pandoc.utils.stringify(meta.image)
    -- The lesson art is a 600x600 square, so the small summary card fits;
    -- summary_large_image would crop it.
    tags[#tags + 1] = '<meta name="twitter:card" content="summary">'
    tags[#tags + 1] = '<meta property="og:image" content="' .. attr_value(img) .. '">'
    tags[#tags + 1] = '<meta property="og:image:width" content="600">'
    tags[#tags + 1] = '<meta property="og:image:height" content="600">'
    tags[#tags + 1] = '<meta name="twitter:image" content="' .. attr_value(img) .. '">'
    if meta["image-alt"] then
      tags[#tags + 1] = '<meta name="twitter:image:alt" content="'
        .. attr_value(meta["image-alt"]) .. '">'
    end
    if meta["image-alt"] then
      tags[#tags + 1] = '<meta property="og:image:alt" content="'
        .. attr_value(meta["image-alt"]) .. '">'
    end
  end
  tags[#tags + 1] = '<script type="application/ld+json">{'
    .. '"@context":"https://schema.org","@type":"LearningResource",'
    .. '"name":"' .. jesc(short) .. '",'
    .. (meta.description
        and ('"description":"' .. jesc(pandoc.utils.stringify(meta.description)) .. '",')
        or '')
    .. (meta.image
        and ('"image":"' .. jesc(BASE .. pandoc.utils.stringify(meta.image)) .. '",')
        or '')
    .. '"learningResourceType":"Slide deck","inLanguage":"en",'
    .. (meta.date
        and ('"datePublished":"' .. jesc(pandoc.utils.stringify(meta.date)) .. '",')
        or '')
    .. (meta.modified
        and ('"dateModified":"' .. jesc(pandoc.utils.stringify(meta.modified)) .. '",')
        or '')
    .. '"author":{"@type":"Person","name":"Nishant Shukla","url":"https://shukla.io"},'
    .. '"isPartOf":{"@type":"Course","name":"Quantum Oracle Engineering",'
    .. '"url":"' .. jesc(BASE) .. '"},'
    .. '"url":"' .. jesc(url) .. '"}</script>'
  tags[#tags + 1] = '<script type="application/ld+json">{'
    .. '"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":['
    .. '{"@type":"ListItem","position":1,"name":"Quantum Oracle Engineering",'
    .. '"item":"' .. jesc(BASE) .. '"},'
    .. '{"@type":"ListItem","position":2,"name":"' .. jesc(short) .. '",'
    .. '"item":"' .. jesc(url) .. '"}]}</script>'
  -- Must precede pandoc's MathJax script tag, which the template emits after
  -- header-includes.  The menu brings an accessibility explorer that captures
  -- arrow keys once a formula takes focus, which kills slide navigation.
  tags[#tags + 1] =
    '<script>window.MathJax={options:{enableMenu:false}};</script>'
  -- The Makefile passes a content hash of the two assets, so a changed
  -- stylesheet or script can never be served from a stale browser cache.
  local v = meta.assets and ("?v=" .. attr_value(meta.assets)) or ""
  tags[#tags + 1] = '<link rel="stylesheet" href="../slides.css' .. v .. '">'
  tags[#tags + 1] = '<script src="../slides.js' .. v .. '" defer></script>'
  tags[#tags + 1] = '<script src="https://cdn.counter.dev/script.js" '
    .. 'data-id="476c224d-08f5-44d4-a25a-005e5c890f79" '
    .. 'data-utcoffset="-7" defer></script>'
  return pandoc.RawBlock("html", table.concat(tags, "\n"))
end

function Pandoc(doc)
  local slides, blocks, attr = {}, {}, nil
  local seg, nseg = nil, 0

  -- Ids are permalinks, so two rules hold at build time.  Every slide and
  -- every segment must carry an explicit `{#slug}`: the Makefile disables
  -- pandoc's auto identifiers for decks, so a forgotten slug (or an untitled
  -- `---` slide) arrives here with an empty id and fails loudly instead of
  -- shipping something hash navigation cannot reach.  And no two may share a
  -- slug: explicit ids pass through pandoc verbatim, and hash navigation
  -- silently lands on the first match, so a duplicate would ship a link that
  -- opens the wrong slide.
  local seen = {}

  local function claim(id, what)
    if seen[id] then
      error(("duplicate id '#%s' (%s and %s)"):format(id, seen[id], what), 0)
    end
    seen[id] = what
  end

  local function flush()
    if #blocks == 0 then return end
    local a = attr or pandoc.Attr()
    local id = a.identifier
    if not id or id == "" then
      local title = (blocks[1] and blocks[1].t == "Header")
        and ('"' .. pandoc.utils.stringify(blocks[1]) .. '"')
        or "untitled, started by ---"
      error(("slide %d (%s) has no {#id}; every slide needs a permalink slug")
        :format(#slides + 1, title), 0)
    end
    claim(id, ("slide %d"):format(#slides + 1))
    -- The authored ## becomes the rendered h1 (and ### becomes h2), so the
    -- hierarchy costs nothing visually.
    for _, b in ipairs(blocks) do
      if b.t == "Header" and b.level >= 2 then b.level = b.level - 1 end
    end
    a.classes:insert("slide")
    if seg then
      a.attributes["segment"] = seg.title
      a.attributes["segment-id"] = seg.id
    end
    slides[#slides + 1] = pandoc.Div(blocks, a)
    blocks, attr = {}, nil
  end

  for _, el in ipairs(doc.blocks) do
    local notes = comment_body(el)
    if el.t == "Header" and el.level == 1 then
      flush()
      nseg = nseg + 1
      if el.identifier == "" then
        error(("segment %d (%q) has no {#id}; a segment id deep-links to its first slide")
          :format(nseg, pandoc.utils.stringify(el)), 0)
      end
      claim(el.identifier, ("segment %d"):format(nseg))
      seg = { title = pandoc.utils.stringify(el), id = el.identifier }
    elseif el.t == "Header" and el.level == 2 then
      flush()
      -- The slide carries the heading's id and classes so that `## Title {.center}`
      -- styles the whole slide and `#title` deep-links to it.
      attr = pandoc.Attr(el.identifier, el.classes, el.attributes)
      el.attr = pandoc.Attr()
      blocks[#blocks + 1] = el
    elseif el.t == "HorizontalRule" then
      flush()
    elseif notes then
      blocks[#blocks + 1] = pandoc.Div(
        pandoc.read(notes, "markdown").blocks,
        pandoc.Attr("", { "notes" })
      )
    else
      blocks[#blocks + 1] = el
    end
  end
  flush()

  local deck = pandoc.Div(slides, pandoc.Attr("deck"))
  local nav = crumb(doc.meta)
  doc.blocks = nav and { nav, deck } or { deck }

  doc.meta["header-includes"] = pandoc.MetaList({
    pandoc.MetaBlocks({ head_tags(doc.meta) })
  })

  return doc
end
