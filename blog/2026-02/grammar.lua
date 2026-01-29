-- grammar.lua - Pandoc Lua filter to visualize grammar rules and parse trees

function Div(el)
  if el.classes:includes("graph") then
    return render_grammar(el)
  elseif el.classes:includes("parse") then
    return render_parse(el)
  elseif el.classes:includes("render") then
    return render_yield(el)
  elseif el.classes:includes("distribution") then
    return render_distribution(el)
  end
end

function render_grammar(el)
  local content = blocks_to_text(el.content)
  local rules = parse_grammar_rules(content)

  local html = '<div class="grammar-graph">\n'
  html = html .. '<span class="viz-label">grammar</span>\n'

  for _, rule in ipairs(rules) do
    html = html .. '<div class="grammar-rule">\n'
    html = html .. string.format('<span class="grammar-lhs">%s</span>', rule.lhs)
    html = html .. '<span class="grammar-arrow">→</span>\n'
    html = html .. '<div class="grammar-rhs">\n'

    for i, alt in ipairs(rule.alternatives) do
      if i > 1 then
        html = html .. '<span class="grammar-pipe">|</span>\n'
      end
      html = html .. '<div class="grammar-alt">\n'
      for _, sym in ipairs(alt) do
        local cls = is_terminal(sym, rules) and "grammar-terminal" or "grammar-nonterminal"
        html = html .. string.format('<span class="%s">%s</span>\n', cls, sym)
      end
      html = html .. '</div>\n'
    end

    html = html .. '</div>\n</div>\n'
  end

  html = html .. '</div>'
  return pandoc.RawBlock("html", html)
end

function render_distribution(el)
  local content = blocks_to_text(el.content)
  local entries = {}
  local max_prob = 0

  -- Parse label: probability pairs
  for line in content:gmatch("[^\n]+") do
    line = line:match("^%s*(.-)%s*$")
    if line ~= "" then
      local label, prob = line:match("^(.-):%s*([%d%.]+)$")
      if label and prob then
        local p = tonumber(prob)
        table.insert(entries, {label = label, prob = p})
        if p > max_prob then
          max_prob = p
        end
      end
    end
  end

  -- SVG dimensions
  local bar_width = 40
  local bar_gap = 10
  local max_bar_height = 120
  local label_height = 25
  local top_padding = 10
  local left_padding = 10

  local total_width = left_padding * 2 + #entries * (bar_width + bar_gap) - bar_gap
  local total_height = top_padding + max_bar_height + label_height

  -- Generate SVG
  local svg = string.format('<svg class="distribution-svg" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid meet">\n',
    total_width, total_height)

  -- Draw bars
  for i, entry in ipairs(entries) do
    local x = left_padding + (i - 1) * (bar_width + bar_gap)
    local bar_height = 0
    if max_prob > 0 then
      bar_height = (entry.prob / max_prob) * max_bar_height
    end
    local y = top_padding + max_bar_height - bar_height

    -- Bar (only draw if height > 0)
    if bar_height > 0 then
      svg = svg .. string.format('<rect class="dist-bar" x="%d" y="%d" width="%d" height="%d" rx="2"/>\n',
        x, math.floor(y), bar_width, math.floor(bar_height))
    else
      -- Draw a thin line to show zero
      svg = svg .. string.format('<rect class="dist-bar-zero" x="%d" y="%d" width="%d" height="2" rx="1"/>\n',
        x, top_padding + max_bar_height - 2, bar_width)
    end

    -- Label
    svg = svg .. string.format('<text class="dist-label" x="%d" y="%d" text-anchor="middle">%s</text>\n',
      x + bar_width / 2, top_padding + max_bar_height + 18, entry.label)
  end

  svg = svg .. '</svg>'

  local html = '<div class="distribution">\n'
  html = html .. '<span class="viz-label">distribution</span>\n'
  html = html .. svg .. '\n</div>'
  return pandoc.RawBlock("html", html)
end

function render_yield(el)
  local content = blocks_to_text(el.content)
  local tokens = {}
  for token in content:gmatch("%S+") do
    table.insert(tokens, token)
  end

  local html = '<div class="render-yield">\n'
  html = html .. '<span class="viz-label">render</span>\n'
  for _, token in ipairs(tokens) do
    html = html .. string.format('<span class="yield-token">%s</span>\n', token)
  end
  html = html .. '</div>'
  return pandoc.RawBlock("html", html)
end

function render_parse(el)
  local content = blocks_to_text(el.content)
  local rules = parse_grammar_rules(content)
  local tree = build_parse_tree(rules)

  -- Calculate tree layout
  local node_width = 60
  local node_height = 26
  local h_spacing = 20
  local v_spacing = 50

  -- Assign positions to all nodes
  layout_tree(tree, node_width, h_spacing)
  local total_width = tree.width
  local total_height = get_tree_depth(tree) * v_spacing + node_height

  -- Generate SVG (no fixed width/height - let CSS handle sizing)
  local svg = string.format('<svg class="parse-tree-svg" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid meet">\n',
    total_width + 20, total_height + 20)
  svg = svg .. '<style>\n'
  svg = svg .. '  .tree-text { font-family: monospace; font-size: 14px; }\n'
  svg = svg .. '  .tree-text.nonterminal { fill: #ebdbb2; font-style: italic; }\n'
  svg = svg .. '  .tree-text.terminal { fill: #1d2021; font-weight: 500; }\n'
  svg = svg .. '  .tree-rect.nonterminal { fill: #458588; }\n'
  svg = svg .. '  .tree-rect.terminal { fill: #b8bb26; }\n'
  svg = svg .. '  .tree-line { stroke: #665c54; stroke-width: 2; }\n'
  svg = svg .. '</style>\n'

  svg = svg .. render_tree_svg(tree, 10, 10, v_spacing, node_height)
  svg = svg .. '</svg>'

  local html = '<div class="parse-tree">\n'
  html = html .. '<span class="viz-label">parse</span>\n'
  html = html .. svg .. '\n</div>'
  return pandoc.RawBlock("html", html)
end

function layout_tree(node, node_width, h_spacing)
  if #node.children == 0 then
    -- Leaf node
    local text_width = #node.name * 9 + 16
    node.width = math.max(node_width, text_width)
    node.offset = 0
  else
    -- Layout children first
    local total_width = 0
    for i, child in ipairs(node.children) do
      layout_tree(child, node_width, h_spacing)
      child.offset = total_width
      total_width = total_width + child.width
      if i < #node.children then
        total_width = total_width + h_spacing
      end
    end
    node.width = total_width
  end
end

function get_tree_depth(node)
  if #node.children == 0 then
    return 1
  end
  local max_depth = 0
  for _, child in ipairs(node.children) do
    local d = get_tree_depth(child)
    if d > max_depth then
      max_depth = d
    end
  end
  return max_depth + 1
end

function render_tree_svg(node, x, y, v_spacing, node_height)
  local svg = ""

  -- Calculate this node's center x position
  local node_center_x = math.floor(x + node.width / 2)
  local text_width = #node.name * 9 + 16
  local rect_width = math.max(50, text_width)
  local rect_x = math.floor(node_center_x - rect_width / 2)

  local cls = #node.children > 0 and "nonterminal" or "terminal"

  -- Draw lines to children first (so they appear behind nodes)
  if #node.children > 0 then
    local child_y = math.floor(y + v_spacing)
    local line_start_y = math.floor(y + node_height)
    local line_mid_y = math.floor(y + node_height + (v_spacing - node_height) / 2)

    -- Vertical line from this node down
    svg = svg .. string.format('<line class="tree-line" x1="%d" y1="%d" x2="%d" y2="%d"/>\n',
      node_center_x, line_start_y, node_center_x, line_mid_y)

    -- Calculate child centers
    local child_centers = {}
    for _, child in ipairs(node.children) do
      local child_center_x = math.floor(x + child.offset + child.width / 2)
      table.insert(child_centers, child_center_x)
    end

    -- Horizontal line connecting children (from first to last child center)
    if #child_centers > 1 then
      svg = svg .. string.format('<line class="tree-line" x1="%d" y1="%d" x2="%d" y2="%d"/>\n',
        child_centers[1], line_mid_y, child_centers[#child_centers], line_mid_y)
    end

    -- Vertical lines down to each child
    for _, cx in ipairs(child_centers) do
      svg = svg .. string.format('<line class="tree-line" x1="%d" y1="%d" x2="%d" y2="%d"/>\n',
        cx, line_mid_y, cx, child_y)
    end

    -- Render children
    for _, child in ipairs(node.children) do
      svg = svg .. render_tree_svg(child, x + child.offset, child_y, v_spacing, node_height)
    end
  end

  -- Draw node rectangle and text
  svg = svg .. string.format('<rect class="tree-rect %s" x="%d" y="%d" width="%d" height="%d" rx="4"/>\n',
    cls, rect_x, math.floor(y), rect_width, node_height)
  svg = svg .. string.format('<text class="tree-text %s" x="%d" y="%d" text-anchor="middle">%s</text>\n',
    cls, node_center_x, math.floor(y + node_height/2 + 5), node.name)

  return svg
end

function parse_grammar_rules(content)
  local rules = {}
  local current_rule = nil

  for line in content:gmatch("[^\n]+") do
    local trimmed = line:match("^%s*(.-)%s*$")  -- trim
    if trimmed ~= "" then
      -- Check if this is a new rule (has lhs: rhs format)
      local lhs, rhs = trimmed:match("^(%S+):%s*(.+)$")
      if lhs and rhs then
        -- Start a new rule
        current_rule = {lhs = lhs, alternatives = {}}
        -- Parse the first alternative(s) on this line
        for alt in rhs:gmatch("[^|]+") do
          alt = alt:match("^%s*(.-)%s*$")  -- trim
          local symbols = {}
          for sym in alt:gmatch("%S+") do
            table.insert(symbols, sym)
          end
          if #symbols > 0 then
            table.insert(current_rule.alternatives, symbols)
          end
        end
        table.insert(rules, current_rule)
      elseif current_rule then
        -- Check if this is a continuation line starting with |
        local continuation = trimmed:match("^|%s*(.+)$")
        if continuation then
          -- Parse additional alternatives from continuation line
          for alt in continuation:gmatch("[^|]+") do
            alt = alt:match("^%s*(.-)%s*$")  -- trim
            local symbols = {}
            for sym in alt:gmatch("%S+") do
              table.insert(symbols, sym)
            end
            if #symbols > 0 then
              table.insert(current_rule.alternatives, symbols)
            end
          end
        end
      end
    end
  end
  return rules
end

function is_terminal(sym, rules)
  for _, rule in ipairs(rules) do
    if rule.lhs == sym then
      return false
    end
  end
  return true
end

function build_parse_tree(rules)
  if #rules == 0 then
    return {name = "empty", children = {}}
  end

  local expansions = {}
  for _, rule in ipairs(rules) do
    expansions[rule.lhs] = rule.alternatives[1]
  end

  local function build_node(name)
    local node = {name = name, children = {}}
    if expansions[name] then
      for _, child_name in ipairs(expansions[name]) do
        table.insert(node.children, build_node(child_name))
      end
    end
    return node
  end

  return build_node(rules[1].lhs)
end

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
