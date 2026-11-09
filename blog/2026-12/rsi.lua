-- Render the Markdown table with visible paper groups and responsive labels.
local function escape(value)
  return tostring(value):gsub('&', '&amp;'):gsub('<', '&lt;')
    :gsub('>', '&gt;'):gsub('"', '&quot;')
end

local function slug(value)
  return value:lower():gsub('[^%w]+', '-'):gsub('^%-', ''):gsub('%-$', '')
end

-- Table headers are bare names; the Markdown prose explains them.
local function axis_name(cell)
  local name = pandoc.utils.stringify(cell.contents)
  assert(name ~= '' and not name:find(':'), 'Table headers must be bare names without a definition.')
  return name
end

local function groups_from(cell)
  local groups, group, paper = {}, nil, nil
  local function finish_paper()
    if not paper then return end
    local suffix = pandoc.utils.stringify(paper.suffix)
    paper.year = suffix:match('%((%d%d%d%d)%)')
    assert(paper.year and not suffix:gsub('%(%d%d%d%d%)', ''):find('[^%s,]'),
      'Expected a parenthesized year after paper: ' .. pandoc.utils.stringify(paper.link.content))
    table.insert(group.papers, paper)
    paper = nil
  end
  for _, block in ipairs(cell.contents) do
    assert(block.t == 'Plain' or block.t == 'Para', 'Paper cells must contain inline lists.')
    for _, inline in ipairs(block.content) do
      local label = inline.t == 'Strong' and pandoc.utils.stringify(inline.content):match('^(.+):$')
      if label then
        finish_paper()
        group = { name = label, papers = {} }
        table.insert(groups, group)
      elseif inline.t == 'Link' then
        assert(group, 'Each paper list needs a bold category label ending with a colon.')
        finish_paper()
        paper = { link = inline, suffix = pandoc.Inlines {} }
      elseif inline.t == 'RawInline' and inline.format == 'html' and inline.text:match('^<br%s*/?>$') then
        finish_paper()
      elseif inline.t == 'Emph' and group and not paper and #group.papers == 0 and not group.caption then
        group.caption = inline.content
      elseif paper then
        paper.suffix:insert(inline)
      else
        assert(inline.t == 'Space' or inline.t == 'SoftBreak', 'Unexpected text before a paper link.')
      end
    end
  end
  finish_paper()
  for _, item in ipairs(groups) do
    assert(#item.papers > 0, 'Empty paper group: ' .. item.name)
  end
  return groups
end

local function render_table(matrix)
  local headers = matrix.head.rows[1].cells
  local columns = { axis_name(headers[2]), axis_name(headers[3]) }
  local rows = {}
  for _, body in ipairs(matrix.bodies) do
    for _, row in ipairs(body.body) do
      assert(#row.cells == 3, 'Expected a row label and two paper cells.')
      table.insert(rows, { name = axis_name(row.cells[1]), cells = row.cells })
    end
  end
  assert(#rows == 2, 'Expected two taxonomy rows.')

  local html = { '<table class="paper-matrix" role="table" aria-labelledby="post-title"><colgroup><col class="row-axis"><col><col></colgroup><thead role="rowgroup"><tr role="row"><td class="corner" role="cell"></td>' }
  for _, column in ipairs(columns) do
    table.insert(html, '<th scope="col" role="columnheader" id="' .. slug(column) .. '">' .. escape(column) .. '</th>')
  end
  table.insert(html, '</tr></thead><tbody role="rowgroup">')
  for _, row in ipairs(rows) do
    local row_id = slug(row.name)
    table.insert(html, '<tr role="row"><th class="row-label" scope="row" role="rowheader" id="' .. row_id .. '"><span>' .. escape(row.name) .. '</span></th>')
    for index, column in ipairs(columns) do
      local cell_id = row_id .. '-' .. slug(column)
      table.insert(html, '<td role="cell" id="' .. cell_id .. '" headers="' .. row_id .. ' ' .. slug(column) .. '"><p class="cell-label" aria-hidden="true">' .. escape(row.name) .. ' · ' .. escape(column) .. '</p>')
      for _, group in ipairs(groups_from(row.cells[index + 1])) do
        local heading = escape(group.name)
        if group.caption then
          -- The caption becomes a hint shown on hover, or on tap or focus.
          local hint_id = cell_id .. '-' .. slug(group.name) .. '-hint'
          local text = pandoc.write(pandoc.Pandoc { pandoc.Plain(group.caption) }, 'html5', { wrap_text = 'none' }):gsub('%s+$', '')
          heading = '<span class="hint" tabindex="0" aria-describedby="' .. hint_id .. '">' .. heading .. '</span><span class="hint-text" role="tooltip" id="' .. hint_id .. '">' .. text .. '</span>'
        end
        table.insert(html, '<section class="paper-group"><h2>' .. heading .. '</h2><ul class="paper-list">')
        for _, paper in ipairs(group.papers) do
          local link = paper.link:clone()
          link.classes:insert('paper-link')
          local label = pandoc.write(pandoc.Pandoc { pandoc.Plain { link } }, 'html5', { wrap_text = 'none' })
          table.insert(html, '<li class="paper">' .. label .. ' <span class="paper-year">(' .. paper.year .. ')</span></li>')
        end
        table.insert(html, '</ul></section>')
      end
      table.insert(html, '</td>')
    end
    table.insert(html, '</tr>')
  end
  table.insert(html, '</tbody></table>')
  return pandoc.RawBlock('html', table.concat(html, '\n'))
end

function Pandoc(doc)
  if not FORMAT:match('html') then return doc end
  local rendered = false
  doc = doc:walk { Table = function(matrix)
    if #matrix.head.rows ~= 1 or #matrix.head.rows[1].cells ~= 3 then return nil end
    local cells = matrix.head.rows[1].cells
    if pandoc.utils.stringify(cells[2].contents) ~= 'Parametric'
      or pandoc.utils.stringify(cells[3].contents) ~= 'Non-parametric' then return nil end
    assert(not rendered, 'Expected one RSI taxonomy table.')
    rendered = true
    return render_table(matrix)
  end }
  assert(rendered, 'Could not find the RSI taxonomy table with Parametric and Non-parametric headers.')
  return doc
end
