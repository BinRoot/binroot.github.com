-- External links open in a new tab. In-page anchors (footnotes, code line
-- anchors) are left alone so they keep scrolling instead of spawning tabs.
function Link(el)
  if el.target:match("^https?://") then
    el.attributes.target = "_blank"
    el.attributes.rel = "noopener"
  end
  return el
end
