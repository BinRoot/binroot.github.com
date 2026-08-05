-- slides.lua -- turn a lesson into a deck of slides.
--
-- A level-1 header starts a new slide and hands its id and classes to that
-- slide; a horizontal rule starts an untitled one.  HTML comments become
-- speaker notes.  Nothing else in the markdown is markup for the deck.

local BASE = "https://shukla.io/quantum-oracle-engineering/"

local function comment_body(el)
  if el.t ~= "RawBlock" or not el.format:match("^html") then return nil end
  return el.text:match("^%s*<!%-%-(.-)%-%->%s*$")
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
  if meta.slug then
    tags[#tags + 1] = '<link rel="canonical" href="'
      .. BASE .. attr_value(meta.slug) .. '/">'
  end
  if meta.description then
    tags[#tags + 1] = '<meta name="description" content="'
      .. attr_value(meta.description) .. '">'
  end
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

  local function flush()
    if #blocks == 0 then return end
    local a = attr or pandoc.Attr()
    a.classes:insert("slide")
    slides[#slides + 1] = pandoc.Div(blocks, a)
    blocks, attr = {}, nil
  end

  for _, el in ipairs(doc.blocks) do
    local notes = comment_body(el)
    if el.t == "Header" and el.level == 1 then
      flush()
      -- The slide carries the heading's id and classes so that `# Title {.center}`
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

  doc.blocks = { pandoc.Div(slides, pandoc.Attr("deck")) }

  doc.meta["header-includes"] = pandoc.MetaList({
    pandoc.MetaBlocks({ head_tags(doc.meta) })
  })

  return doc
end
