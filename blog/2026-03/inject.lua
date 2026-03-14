-- inject.lua — Pandoc Lua filter
-- Replaces fenced divs whose id matches a local .html file
-- with the contents of that file as raw HTML.
--
-- Usage in Markdown:
--   ::: {#game-component}
--   :::
-- This looks for game-component.html and injects it.

function Div(el)
  if el.identifier and el.identifier ~= "" then
    local file = el.identifier .. ".html"
    local f = io.open(file, "r")
    if f then
      local content = f:read("*a")
      f:close()

      -- If the div has extra attributes, inject them as a JS global object
      -- e.g. ::: {#game-component status-black="Black: go!"}
      -- becomes: window.game_component_strings = {"status-black": "Black: go!"}
      local script = ""
      local hasAttrs = false
      for k, v in pairs(el.attributes) do
        hasAttrs = true
        break
      end
      if hasAttrs then
        local varName = el.identifier:gsub("-", "_") .. "_strings"
        local json = "{"
        local first = true
        for k, v in pairs(el.attributes) do
          if not first then json = json .. "," end
          v = v:gsub('"', '\\"')
          json = json .. '"' .. k .. '":"' .. v .. '"'
          first = false
        end
        json = json .. "}"
        script = "<script>window." .. varName .. " = " .. json .. ";</script>\n"
      end

      return pandoc.RawBlock("html", script .. content)
    end
  end
end
