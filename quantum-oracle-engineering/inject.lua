-- inject.lua -- Pandoc Lua filter, deck edition of the blog's inject.lua.
-- Replaces fenced divs whose id matches a fragment file with that file's
-- contents as raw HTML.  A fragment is looked up first beside the deck's
-- slides.md, then in the shared assets/ directory, so decks share components
-- while keeping the option of a deck-local override.
--
-- Usage in Markdown:
--   ::: {#cs-stack}
--   :::
-- injects <deck dir>/cs-stack.html, else assets/cs-stack.html.
--
-- Extra attributes on the div become a JS global, as in the blog original:
--   ::: {#game-component status-black="Black: go!"}
-- becomes: window.game_component_strings = {"status-black": "Black: go!"}

local function deck_dir()
  local input = PANDOC_STATE.input_files[1] or ""
  return input:match("^(.*)/[^/]*$") or "."
end

-- Fragment scripts load straight from assets/ with no other cache control,
-- so browsers happily serve stale copies across edits.  Stamp every
-- ../assets/*.js reference with a content hash, so a plain reload always
-- fetches current code after a rebuild.
local function file_hash(path)
  local f = io.open(path, "rb")
  if not f then return nil end
  local c = f:read("*a")
  f:close()
  local h = 5381
  for i = 1, #c, 61 do
    h = (h * 33 + c:byte(i)) % 4294967296
  end
  return tostring(h) .. "-" .. tostring(#c)
end

local function version_scripts(content)
  return (content:gsub('src="%.%./assets/([%w%-_%.]+%.js)"', function(name)
    local v = file_hash("assets/" .. name)
    if not v then return 'src="../assets/' .. name .. '"' end
    return 'src="../assets/' .. name .. '?v=' .. v .. '"'
  end))
end

function Div(el)
  if not el.identifier or el.identifier == "" then return nil end
  local name = el.identifier .. ".html"
  local f = io.open(deck_dir() .. "/" .. name, "r")
    or io.open("assets/" .. name, "r")
  if not f then return nil end
  local content = version_scripts(f:read("*a"))
  f:close()

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

-- Script tags authored directly in the markdown (not via a fragment) get
-- the same content-hash stamping.
function RawBlock(el)
  if el.format:match("^html") and el.text:find("%.%./assets/") then
    return pandoc.RawBlock(el.format, version_scripts(el.text))
  end
end
