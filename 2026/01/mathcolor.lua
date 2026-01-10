-- Named color palette (seaborn "muted")
local named_colors = {
  blue   = "#4878d0",
  orange = "#ee854a",
  green  = "#6acc64",
  red    = "#d65f5f",
  purple = "#956cb4",
  brown  = "#8c613c",
  pink   = "#dc7ec0",
  gray   = "#797979",
  olive  = "#d5bb67",
  cyan   = "#82c6e2",
}

-- Storage for math tokens -> color and text words -> color
local math_colors = {}
local text_colors = {}

local function escape_lua_pattern(s)
  return (s:gsub("([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1"))
end

-- Resolve color: named color or pass through CSS value
local function resolve_color(name)
  return named_colors[name] or name
end

-- Extract raw TeX content from MetaInlines (handles RawInline properly)
local function extract_tex(inlines)
  local result = {}
  for _, el in ipairs(inlines) do
    if el.t == "RawInline" and el.format == "tex" then
      table.insert(result, el.text)
    elseif el.t == "Str" then
      table.insert(result, el.text)
    elseif el.t == "Space" then
      table.insert(result, " ")
    end
  end
  return table.concat(result)
end

-- Extract items from a MetaList or single MetaInlines
local function extract_items(value)
  local items = {}
  if not value then return items end

  -- Check if it's a list (first element is a table, not userdata)
  if #value > 0 and type(value[1]) == "table" then
    -- It's a list of items
    for _, item in ipairs(value) do
      local token = extract_tex(item)
      if token and #token > 0 then
        table.insert(items, token)
      end
    end
  else
    -- Single item (MetaInlines)
    local token = extract_tex(value)
    if token and #token > 0 then
      table.insert(items, token)
    end
  end
  return items
end

-- Separate storage for single-word and multi-word phrases
local single_word_colors = {}
local multi_word_colors = {}

-- Helper to extract text from a sequence of inlines
local function inlines_to_text(inlines, start_idx, count)
  local parts = {}
  local idx = start_idx
  local words_seen = 0
  while idx <= #inlines and words_seen < count do
    local el = inlines[idx]
    if el.t == "Str" then
      table.insert(parts, el.text)
      words_seen = words_seen + 1
    elseif el.t == "Space" then
      table.insert(parts, " ")
    else
      break  -- Non-text element breaks the sequence
    end
    idx = idx + 1
  end
  return table.concat(parts), idx - start_idx
end

-- Return a list of filters to ensure they run in sequence with shared state
return {
  {
    Meta = function(meta)
      if not meta.mathcolor then return end

      -- Iterate over color keys (e.g., "blue", "red", "#custom")
      for color_key, color_value in pairs(meta.mathcolor) do
        local hex = resolve_color(pandoc.utils.stringify(color_key))

        -- Extract math tokens
        if color_value.math then
          for _, token in ipairs(extract_items(color_value.math)) do
            math_colors[token] = hex
          end
        end

        -- Extract text words/phrases
        if color_value.text then
          for _, phrase in ipairs(extract_items(color_value.text)) do
            -- Check if it's a multi-word phrase (contains space)
            if phrase:find(" ") then
              local word_count = 0
              for _ in phrase:gmatch("%S+") do word_count = word_count + 1 end
              table.insert(multi_word_colors, {phrase = phrase, hex = hex, word_count = word_count})
            else
              single_word_colors[phrase] = hex
              text_colors[phrase] = hex  -- Keep for backwards compat
            end
          end
        end
      end

      -- Sort multi-word phrases by word count (longest first)
      table.sort(multi_word_colors, function(a, b) return a.word_count > b.word_count end)
    end
  },
  {
    Pandoc = function(doc)
      -- Only colorize the document body, not metadata (e.g. keywords in <meta> tags).
      if not (FORMAT:match("html")) then return nil end

      local body_filters = {
        Math = function(el)
          if not (FORMAT:match("html")) then return nil end

          local t = el.text
          for token, hex in pairs(math_colors) do
            local pat = escape_lua_pattern(token)
            t = t:gsub(pat, "\\style{color:" .. hex .. ";}{" .. token .. "}")
          end
          el.text = t
          return el
        end,

        -- Handle inline lists to match multi-word phrases
        Inlines = function(inlines)
          if not (FORMAT:match("html")) then return nil end
          if #multi_word_colors == 0 then return nil end

          local result = {}
          local i = 1
          local modified = false

          while i <= #inlines do
            local el = inlines[i]
            local matched = false

            -- Only try multi-word matching at Str elements
            if el.t == "Str" then
              -- Try each multi-word phrase (longest first)
              for _, entry in ipairs(multi_word_colors) do
                local text, consumed = inlines_to_text(inlines, i, entry.word_count * 2)  -- *2 to include spaces

                -- Check if this text starts with the phrase
                local pat = "^" .. escape_lua_pattern(entry.phrase)
                if text:find(pat) then
                  -- Count how many inlines we need to consume
                  local phrase_len = #entry.phrase
                  local chars_seen = 0
                  local elements_to_consume = 0
                  local j = i
                  while j <= #inlines and chars_seen < phrase_len do
                    local curr = inlines[j]
                    if curr.t == "Str" then
                      chars_seen = chars_seen + #curr.text
                      elements_to_consume = elements_to_consume + 1
                    elseif curr.t == "Space" then
                      chars_seen = chars_seen + 1
                      elements_to_consume = elements_to_consume + 1
                    else
                      break
                    end
                    j = j + 1
                  end

                  -- Create the underlined span
                  local span = '<span style="text-decoration:underline;text-decoration-color:'
                    .. entry.hex .. ';">' .. entry.phrase .. '</span>'
                  table.insert(result, pandoc.RawInline("html", span))
                  i = i + elements_to_consume
                  matched = true
                  modified = true
                  break
                end
              end
            end

            if not matched then
              table.insert(result, el)
              i = i + 1
            end
          end

          if modified then
            return result
          end
          return nil
        end,

        Str = function(el)
          if not (FORMAT:match("html")) then return nil end

          local text = el.text
          local result = {}
          local pos = 1

          -- Sort words by length (longest first) to match longer words before shorter ones
          local sorted_words = {}
          for word, hex in pairs(single_word_colors) do
            table.insert(sorted_words, {word = word, hex = hex})
          end
          table.sort(sorted_words, function(a, b) return #a.word > #b.word end)

          while pos <= #text do
            local found_match = false

            -- Try to match any text word at current position (longest first)
            for _, entry in ipairs(sorted_words) do
              local word, hex = entry.word, entry.hex
              local pat = "^" .. escape_lua_pattern(word)
              local match_start, match_end = text:find(pat, pos)

              if match_start == pos then
                -- Found a match at current position
                local span = '<span style="text-decoration:underline;text-decoration-color:'
                  .. hex .. ';">' .. word .. '</span>'
                table.insert(result, pandoc.RawInline("html", span))
                pos = match_end + 1
                found_match = true
                break
              end
            end

            if not found_match then
              -- No match, collect characters until next potential match
              local next_match_pos = #text + 1
              for _, entry in ipairs(sorted_words) do
                local idx = text:find(escape_lua_pattern(entry.word), pos)
                if idx and idx < next_match_pos then
                  next_match_pos = idx
                end
              end

              -- Add unmatched text as Str
              local unmatched = text:sub(pos, next_match_pos - 1)
              if #unmatched > 0 then
                table.insert(result, pandoc.Str(unmatched))
              end
              pos = next_match_pos
            end
          end

          if #result > 0 then
            return result
          end
          return nil
        end
      }

      local new_blocks = {}
      for i, blk in ipairs(doc.blocks) do
        new_blocks[i] = pandoc.walk_block(blk, body_filters)
      end
      doc.blocks = new_blocks
      return doc
    end
  }
}
