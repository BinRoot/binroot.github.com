-- anchor.lua: Add hover anchor links to headers

function Header(el)
  if el.identifier and el.identifier ~= "" then
    local anchor = pandoc.Link("#", "#" .. el.identifier, "", {class = "header-anchor"})
    table.insert(el.content, 1, anchor)
  end
  return el
end
