function Link(el)
  -- Always open in a new tab
  el.attributes["target"] = "_blank"

  -- Security best practice when using target=_blank
  -- Keep any existing rel values if present.
  local rel = el.attributes["rel"] or ""
  if not rel:match("noopener") then rel = (rel .. " noopener"):gsub("^%s+", "") end
  if not rel:match("noreferrer") then rel = (rel .. " noreferrer"):gsub("^%s+", "") end
  el.attributes["rel"] = rel

  return el
end
