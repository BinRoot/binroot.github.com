-- mermaid.lua - Pandoc Lua filter to render mermaid diagrams using beautiful-mermaid

-- Handle ```mermaid code blocks
function CodeBlock(el)
  if el.classes:includes("mermaid") then
    return render_mermaid(el.text, el.attributes["theme"])
  end
end

-- Handle :::mermaid fenced divs
function Div(el)
  if el.classes:includes("mermaid") then
    local text = blocks_to_text(el.content)
    return render_mermaid(text, el.attributes["theme"])
  end
end

-- Render mermaid text to SVG using beautiful-mermaid
function render_mermaid(text, theme)
  local args = {"mermaid-cli.mjs"}
  if theme and theme ~= "" then
    table.insert(args, "--theme")
    table.insert(args, theme)
  end

  -- Use pandoc.pipe to run the command with stdin
  local success, svg = pcall(pandoc.pipe, "node", args, text)

  if success and svg and svg ~= "" then
    local html = '<div class="mermaid-diagram">\n' .. svg .. '\n</div>'
    return pandoc.RawBlock("html", html)
  else
    io.stderr:write("mermaid.lua: failed to render diagram\n")
    if not success then
      io.stderr:write("  error: " .. tostring(svg) .. "\n")
    end
    return nil
  end
end

-- Extract text content from blocks (for fenced divs)
function blocks_to_text(blocks)
  local lines = {}
  for _, block in ipairs(blocks) do
    if block.t == "Para" or block.t == "Plain" then
      local line = ""
      for _, inline in ipairs(block.content) do
        if inline.t == "Str" then
          line = line .. inline.text
        elseif inline.t == "Space" then
          line = line .. " "
        elseif inline.t == "SoftBreak" or inline.t == "LineBreak" then
          table.insert(lines, line)
          line = ""
        end
      end
      if line ~= "" then
        table.insert(lines, line)
      end
    elseif block.t == "CodeBlock" then
      for line in block.text:gmatch("[^\n]+") do
        table.insert(lines, line)
      end
    end
  end
  return table.concat(lines, "\n")
end
