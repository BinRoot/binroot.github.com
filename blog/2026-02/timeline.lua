-- timeline.lua - Pandoc Lua filter to transform timeline divs

function Div(el)
  if el.classes:includes("timeline") then
    -- Process the content inside the timeline div
    local items = {}

    for _, block in ipairs(el.content) do
      if block.t == "BulletList" then
        for _, item in ipairs(block.content) do
          local item_html = process_timeline_item(item)
          table.insert(items, item_html)
        end
      end
    end

    local html = '<div class="timeline">\n' .. table.concat(items, "\n") .. '\n</div>'
    return pandoc.RawBlock("html", html)
  end
end

function process_timeline_item(item)
  -- item is a list of blocks (the content of a list item)
  local content = pandoc.utils.stringify(item)

  -- Check if this item has sub-items (nested list)
  local has_subitems = false
  local subitems = {}
  local main_content = {}

  for _, block in ipairs(item) do
    if block.t == "BulletList" then
      has_subitems = true
      for _, subitem in ipairs(block.content) do
        table.insert(subitems, subitem)
      end
    else
      table.insert(main_content, block)
    end
  end

  if has_subitems then
    -- This is an era grouping (e.g., "From the 60s-80s...")
    local era_text = blocks_to_html(main_content)
    local formatted_era = format_era(era_text)
    local subitems_html = {}

    for _, subitem in ipairs(subitems) do
      local sub_html = process_subitem(subitem)
      table.insert(subitems_html, sub_html)
    end

    return string.format(
      '<div class="timeline-item"><div class="timeline-era">%s</div>\n%s</div>',
      formatted_era,
      table.concat(subitems_html, "\n")
    )
  else
    -- Regular timeline item - extract year if present
    local html_content = blocks_to_html(main_content)
    local year, rest = extract_year(html_content)

    if year then
      return string.format(
        '<div class="timeline-item"><span class="timeline-year">%s</span> %s</div>',
        year, rest
      )
    else
      -- Check if this is a "skip" item (e.g., "... skipping ...")
      if is_skip_item(html_content) then
        return string.format('<div class="timeline-item timeline-skip">%s</div>', html_content)
      end
      return string.format('<div class="timeline-item">%s</div>', html_content)
    end
  end
end

function is_skip_item(text)
  -- Match items that indicate a time skip
  if text:match("^%s*%(%.%.%.") or text:match("skipping") or text:match("^%s*%.%.%.") then
    return true
  end
  return false
end

function process_subitem(item)
  local html_content = blocks_to_html(item)
  local year, rest = extract_year(html_content)

  if year then
    return string.format(
      '<div class="timeline-subitem"><span class="timeline-year">%s</span> %s</div>',
      year, rest
    )
  else
    return string.format('<div class="timeline-subitem">%s</div>', html_content)
  end
end

function blocks_to_html(blocks)
  local doc = pandoc.Pandoc(blocks)
  local html = pandoc.write(doc, "html")
  -- Remove wrapping <p> tags for inline display
  html = html:gsub("^%s*<p>", ""):gsub("</p>%s*$", "")
  return html
end

function extract_year(text)
  -- Match "In YYYY," or "In YYYY " at the start
  local year, rest = text:match("^In (%d%d%d%d),?%s*(.*)$")
  if year then
    return year, rest
  end

  -- Match standalone year at start like "2023 -" or "2023:"
  year, rest = text:match("^(%d%d%d%d)%s*[-:]?%s*(.*)$")
  if year then
    return year, rest
  end

  return nil, text
end

function format_era(text)
  -- Match patterns like "From the 60s-80s," or "In the 1960s-1980s,"
  local prefix, era, suffix = text:match("^(.-)(%d+s%-%d+s),?%s*(.*)$")
  if era then
    return string.format('%s<span class="timeline-year">%s</span>, %s', prefix, era, suffix)
  end

  -- Match patterns like "From 1960-1980,"
  prefix, era, suffix = text:match("^(.-)((%d%d%d%d)%-(%d%d%d%d)),?%s*(.*)$")
  if era then
    return string.format('%s<span class="timeline-year">%s</span>, %s', prefix, era, suffix)
  end

  -- No era found, return as-is
  return text
end
