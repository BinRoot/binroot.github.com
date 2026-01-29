-- header.lua: Custom header with home button on left, author/date on right

function Pandoc(doc)
  local meta = doc.meta

  -- Build the custom header HTML
  local title = pandoc.utils.stringify(meta.title or "")
  local author = pandoc.utils.stringify(meta.author or "")
  local date = pandoc.utils.stringify(meta.date or "")

  local header_html = string.format([[
<header id="title-block-header">
  <h1 class="title">%s</h1>
</header>
<div class="header-meta-row">
  <a href="/" class="home-link">← Home</a>
  <span class="header-meta">
    <span class="author">%s</span>
    <span class="meta-sep">·</span>
    <span class="date">%s</span>
  </span>
</div>
]], title, author, date)

  -- Create a raw block with the header
  local header_block = pandoc.RawBlock('html', header_html)

  -- Insert at the beginning of the document
  table.insert(doc.blocks, 1, header_block)

  -- Use pagetitle for <title> element, remove title/author/date
  -- to prevent pandoc's default header block
  doc.meta.pagetitle = meta.title
  doc.meta.title = nil
  doc.meta.author = nil
  doc.meta.date = nil

  return doc
end
